document.addEventListener('DOMContentLoaded', function () {
    
    function esCadenaVacia(cadena) {
        return cadena.trim() === '';
    }
    
    function contieneSoloLetras(cadena) {
        return /^[a-zA-Zá-únÑ\s]*$/.test(cadena);
    }
    
    //Variables de JS
    const nombreCompleto = document.getElementById('nombreCompleto');
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskTimeInput = document.getElementById('taskTime');
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('searchInput');
    const filterCompletedButton = document.getElementById('filterCompletedButton');
    const showAllButton = document.getElementById('showAllButton');
    const tasks = [];
    const storedNombre = localStorage.getItem('nombre');
    const clearAllButton = document.getElementById('clearAllButton');
    clearAllButton.addEventListener('click', function () {
        clearAllTasks();
    });

    //Solicitar nombre con libreria
    if (storedNombre) {
        nombreCompleto.textContent = storedNombre;
    }else{
        Swal.fire({
            title: 'Ingrese su nombre:',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: false,
            confirmButtonText: 'Ingresar',
            preConfirm: (nombre) => {
                if (!esCadenaVacia(nombre) && contieneSoloLetras(nombre)) {
                    localStorage.setItem('nombre', nombre);
                    nombreCompleto.textContent = nombre;
                } else {
                    Swal.showValidationMessage('Por favor, ingresa tu nombre sin números.');
                    return false;
                }
            }
        });
    }
    //Uso de Fetch
    function cargarDatosDesdeArchivo() {
        const datosCargados = localStorage.getItem('datosCargados');

        if (!datosCargados) {
            fetch('./JS/datos.js')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error al cargar datos. Status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(datosEnTexto => {
                    eval(datosEnTexto);
                    tasks.push(...datos);
                    renderTasks();
                    localStorage.setItem('datosCargados', true)
                })
                .catch(error => {
                    console.error('Error al cargar datos:', error);
                });
        }
    }
    cargarDatosDesdeArchivo();

    //Notificaciones con Toastify
    function mostrarNotificacion(mensaje) {
        Toastify({
            text: mensaje,
            duration: 1500,
            gravity: "bottom",
            position: "center",
            stopOnFocus: true,
            style: {
                background: "linear-gradient(to right, #807b97, #feb8d4, #a9d4b8, #a0bc73, #ffe49f)",
                color: "#000000",
            },
        }).showToast();
    }

    //Funciones esenciales
    function addTask(text, time) {
        const task = {
            id: Date.now(),
            text: text,
            time: time,
            completed: false
        };

        tasks.push(task);
        saveTasksToLocalStorage();
        renderTask(task);
        mostrarNotificacion(`Tarea "${task.text}" agregada correctamente.`);
    }

    function renderTask(task) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        const timeSpan = document.createElement('span');
        const deleteButton = document.createElement('span');

        span.textContent = task.text;
        timeSpan.textContent = `Hora: ${task.time}`;
        deleteButton.textContent = 'Eliminar';
        deleteButton.className = 'delete';

        deleteButton.addEventListener('click', function (event) {
            event.stopPropagation();
            deleteTask(task.id);
        });

        li.appendChild(span);
        li.appendChild(timeSpan);
        li.appendChild(deleteButton);

        if (task.completed) {
            li.classList.add('completed');
        }

        li.addEventListener('click', function () {
            toggleTaskStatus(task.id);
        });

        taskList.appendChild(li);
    }

    function deleteTask(id) {
        const index = tasks.findIndex(task => task.id === id);

        if (index !== -1) {
            tasks.splice(index, 1);
            saveTasksToLocalStorage();
            renderTasks();
            mostrarNotificacion('Tarea eliminada correctamente.');
        }
    }

    function toggleTaskStatus(id) {
        const index = tasks.findIndex(task => task.id === id);

        if (index !== -1) {
            tasks[index].completed = !tasks[index].completed;
            saveTasksToLocalStorage();
            renderTasks();

            const action = tasks[index].completed ? 'completada' : 'marcada como no completada';
            mostrarNotificacion(`Tarea "${tasks[index].text}" ${action}.`);
        }
    }

    function renderTasks() {
        tasks.sort((a, b) => {
            return new Date(`1970-01-01T${a.time}`) - new Date(`1970-01-01T${b.time}`);
        });
        taskList.innerHTML = '';
        tasks.forEach(task => renderTask(task));
    }

    //Función para buscar
    function searchTasks(query) {
        const lowerCaseQuery = query.toLowerCase();
        const searchResults = tasks.filter(task => task.text.toLowerCase().includes(lowerCaseQuery));
        renderFilteredTasks(searchResults);
    }

    function filterCompletedTasks() {
        const completedTasks = tasks.filter(task => task.completed);
        renderFilteredTasks(completedTasks);
        if (completedTasks.length > 0) {
            mostrarNotificacion('Mostrando tareas completadas.');
        } else {
            mostrarNotificacion('No hay tareas completadas.');
        }
    }

    function showAllTasks() {
        renderTasks();
        mostrarNotificacion('Mostrando todas las tareas.');
    }

    function clearAllTasks() {
        if (tasks.length > 0) {
            Swal.fire({
                title: '¿Estás seguro?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Borrar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    tasks.length = 0; // Borra todas las tareas
                    saveTasksToLocalStorage();
                    renderTasks();
                    mostrarNotificacion('Todas las tareas han sido borradas.');
                }
            });
        } else {
            mostrarNotificacion('No hay tareas para borrar.');
        }
    }

    function renderFilteredTasks(filteredTasks) {
        taskList.innerHTML = '';
        filteredTasks.forEach(task => renderTask(task));
    }
    
    //Guardar las tareas en el almacenamiento local
    function saveTasksToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    //Obtener tareas almacenadas en el almacenamiento local
    function loadTasksFromLocalStorage() {
        const storedTasks = JSON.parse(localStorage.getItem('tasks'));

        if (storedTasks) {
            tasks.push(...storedTasks);
            renderTasks();
        }
    }

    //Eventos
    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const taskText = taskInput.value.trim();
        const taskTime = taskTimeInput.value;

        if (!esCadenaVacia(taskText) && !esCadenaVacia(taskTime)) {
            addTask(taskText, taskTime);
            taskInput.value = '';
            taskTimeInput.value = '';
        } else {
            mostrarNotificacion('Por favor, completa ambos campos para agregar una tarea.');
        }
    });

    searchInput.addEventListener('input', function () {
        searchTasks(searchInput.value);
    });


    filterCompletedButton.addEventListener('click', function () {
        filterCompletedTasks();
    });

    showAllButton.addEventListener('click', function () {
        showAllTasks();
    });

    // Inicialización
    loadTasksFromLocalStorage();
});