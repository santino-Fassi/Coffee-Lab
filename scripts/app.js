'use strict';

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("ServiceWorker operando"))
    .catch((error) => console.log(`Error al iniciar el ServiceWorker: ${error}`));
}

class Receta {
    id = 0;
    nombre = "";
    ingredientes = [];
    tareas = [];
    dificultad = "";
    editando = false;
    _contadorIds = 0;
    static contadorRecetas = -1;

    constructor(id, nombre, ingredientes, tareas, dificultad = "Fácil") {
        this.id = id;
        this.nombre = nombre;
        this.ingredientes = ingredientes;
        this.tareas = tareas;
        this.dificultad = dificultad;
        this._contadorIds = this.tareas.reduce((max, t) => Math.max(max, t.id), -1);
    }

    static obtenerRecetaId() {
        Receta.contadorRecetas++;
        return Receta.contadorRecetas;
    }

    static crearReceta() {
        return new Promise((resolver, rechazar) => {
            const dial = document.createElement("dialog");
            dial.className = "mi-modal";
            dial.style.margin = "auto";

            const div = document.createElement("div");
            const form = document.createElement("form");
            form.autocomplete = false;
            const tituloModal = document.createElement("h2");
            tituloModal.textContent = `Nueva Receta`;
            form.append(tituloModal);


            const labelNombre = document.createElement("label");
            labelNombre.textContent = "Nombre:";
            const inputNombre = document.createElement("input");
            inputNombre.type = "text";
            inputNombre.required = true;
            inputNombre.placeholder = "Milkshake...";
            inputNombre.id = "inputNombre";
            labelNombre.htmlFor = inputNombre.id;
            form.append(labelNombre);
            form.append(inputNombre);

            const labelDif = document.createElement("label");
            labelDif.textContent = "Dificultad:";
            const inputDif = document.createElement("select");
            inputDif.className = "form-select mt-auto";
            inputDif.required = true;
            inputDif.id = "inputDif";

            const difPlaceholder = document.createElement("option");
            difPlaceholder.selected = true;
            difPlaceholder.disabled = true;
            difPlaceholder.value = "";
            difPlaceholder.textContent = "Elige...";

            const facil = document.createElement("option");
            facil.textContent = "Fácil";
            facil.value = facil.textContent;

            const media = document.createElement("option");
            media.textContent = "Media";
            media.value = media.textContent;

            const dificil = document.createElement("option");
            dificil.textContent = "Difícil";
            dificil.value = dificil.textContent;

            inputDif.append(difPlaceholder, facil, media, dificil);

            labelDif.htmlFor = inputDif.id;
            form.append(labelDif);
            form.append(inputDif);


            const footer = document.createElement("footer");
            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.textContent = "Cancelar";
            cancelBtn.className = "btn-cancelar";
            cancelBtn.addEventListener("click", () => {
                dial.close();
                dial.remove();
                rechazar("Se canceló la acción");
            });
            footer.append(cancelBtn);
            const GuardarBtn = document.createElement("button");
            GuardarBtn.type = "submit";
            GuardarBtn.textContent = "Añadir Receta";
            GuardarBtn.className = "btn-confirmar";
            footer.append(GuardarBtn);

            form.addEventListener("submit", (evento) => {
                evento.preventDefault();
                const receta = new Receta(Receta.obtenerRecetaId(), inputNombre.value.trim(), [], [], inputDif.value);

                dial.close();
                dial.remove();
                resolver(receta);
            });

            form.append(footer);
            div.append(form);



            dial.append(div);

            document.body.append(dial);
            dial.showModal();
        });

    }

    obtenerTareaId() {
        this._contadorIds++;
        return this._contadorIds;
    }

    agregarTarea(tarea) {
        this.tareas.push(tarea);
    }
    eliminarTarea(idTarea) {
        this.tareas = this.tareas.filter(tarea => tarea.id != idTarea);
    }

    obtenerElementoReceta() {
        const receta = document.createElement("div");
        receta.id = `receta_${this.id}`;
        receta.classList.add("position-relative", "tarjeta-receta");

        const badgeDif = document.createElement("span");
        badgeDif.className = "position-absolute top-0 start-50 translate-middle p-2 border border-light rounded-circle";
        switch (this.dificultad) {
            case "Fácil":
                badgeDif.style.backgroundColor = "green";
                break;
            case "Media":
                badgeDif.style.backgroundColor = "orange";
                break;
            case "Difícil":
                badgeDif.style.backgroundColor = "red";
                break;
        }
        badgeDif.textContent = this.dificultad.toUpperCase();
        receta.append(badgeDif);

        const titulo = document.createElement("h3");
        titulo.textContent = this.nombre;
        receta.append(titulo);

        const footer = document.createElement("footer");
        const verBtn = document.createElement("button");
        verBtn.textContent = "Ver Receta";
        verBtn.className = "btn-ver-receta";
        verBtn.addEventListener("click", () => {
            recetaSeleccionada = this;
            this.verDetalle();
        });
        footer.append(verBtn);

        const borrarBtn = document.createElement("button");
        borrarBtn.textContent = "🗑";
        borrarBtn.ariaLabel = "Borrar Receta";
        borrarBtn.className = "btn-borrar-receta";
        borrarBtn.addEventListener("click", () => {
            const respuesta = consulta("Atención", `Desea borrar ${this.nombre}?`)
                .then((respuesta) => {
                    if (respuesta) {
                        recetas = recetas.filter(receta => receta.id != this.id);
                        guardarRecetas();
                        renderizarRecetas(filtroActual);
                    }
                });

        });
        footer.append(borrarBtn);

        receta.append(footer);

        return receta;
    }

    verDetalle() {
        const capturarDatosFormulario = () => {
            const inputNombre = document.querySelector("#input-nombre");
            const contenedorInputsIngredientes = document.querySelector("#contenedor-inputs-ingredientes");
            const selectDificultad = document.querySelector("#inputDif");
            if (inputNombre.value.trim() != "") {
                this.nombre = inputNombre.value.trim();
            }

            this.dificultad = selectDificultad.value;

            const inputs = contenedorInputsIngredientes.querySelectorAll(".input-ingrediente");
            this.ingredientes = Array.from(inputs)
                .map(input => input.value.trim())
                .filter(valor => valor != "");
            
            guardarRecetas();
            
            const elementoViejo = document.querySelector(`#receta_${this.id}`);
            elementoViejo.replaceWith(this.obtenerElementoReceta());
        };
        recetaSeleccionada = this;
        const contenedor = document.querySelector("#detalle-contenido");
        contenedor.innerHTML = "";

        if (this.editando) {
            const labelNombre = document.createElement("label");
            labelNombre.className = "form-label fw-bold mt-2";
            labelNombre.textContent = "Nombre de la Receta:";

            const inputNombre = document.createElement("input");
            inputNombre.type = "text";
            inputNombre.className = "form-control fs-3 mb-3";
            inputNombre.id = "input-nombre";
            inputNombre.value = this.nombre;
            inputNombre.required = true;

            labelNombre.htmlFor = inputNombre.id;

            contenedor.append(labelNombre, inputNombre);

            const labelDif = document.createElement("label");
            labelDif.className = "form-label fw-bold mt-2";
            labelDif.textContent = "Dificultad:";

            const inputDif = document.createElement("select");
            inputDif.className = "form-select mt-auto";
            inputDif.required = true;
            inputDif.id = "inputDif";

            const difPlaceholder = document.createElement("option");
            difPlaceholder.disabled = true;
            difPlaceholder.value = "";
            difPlaceholder.textContent = "Elige...";

            const facil = document.createElement("option");
            facil.textContent = "Fácil";
            facil.value = facil.textContent;
            facil.selected = this.dificultad == facil.value;

            const media = document.createElement("option");
            media.textContent = "Media";
            media.value = media.textContent;
            media.selected = this.dificultad == media.value;

            const dificil = document.createElement("option");
            dificil.textContent = "Difícil";
            dificil.value = dificil.textContent;
            dificil.selected = this.dificultad == dificil.value;

            inputDif.append(difPlaceholder, facil, media, dificil);

            labelDif.htmlFor = inputDif.id;

            contenedor.append(labelDif, inputDif);

        }
        else {
            const titulo = document.createElement("h2");
            titulo.textContent = this.nombre;
            contenedor.append(titulo);

            const dificultad = document.createElement("p");
            dificultad.textContent = `Dificultad: ${this.dificultad}`;
            contenedor.append(dificultad);
        }

        const tituloIngredientes = document.createElement("h3");
        tituloIngredientes.textContent = "Ingredientes";
        contenedor.append(tituloIngredientes);

        if (this.editando) {

            const contenedorInputsIngredientes = document.createElement("div");
            contenedorInputsIngredientes.className = "mb-2";
            contenedorInputsIngredientes.id = "contenedor-inputs-ingredientes";

            this.ingredientes.forEach(ingrediente => {
                contenedorInputsIngredientes.append(this.crearFilaIngrediente(ingrediente));
            });

            const btnAgregarIngrediente = document.createElement("button");
            btnAgregarIngrediente.type = "button";
            btnAgregarIngrediente.className = "btn btn-lg btn-agregar-ingrediente";
            btnAgregarIngrediente.textContent = "+ Agregar Ingrediente";
            btnAgregarIngrediente.addEventListener("click", () => {
                const nuevaFila = this.crearFilaIngrediente("");
                contenedorInputsIngredientes.append(nuevaFila);
                nuevaFila.querySelector("input").focus();
            });

            contenedor.append(contenedorInputsIngredientes, btnAgregarIngrediente);
        }
        else {
            if (this.ingredientes.length > 0) {
                const listaIngredientes = document.createElement("ul");
                this.ingredientes.forEach(ingrediente => {
                    const li = document.createElement("li");
                    li.textContent = ingrediente;
                    listaIngredientes.append(li);
                });
                contenedor.append(listaIngredientes);
            }
            else {
                const notaIngredientes = document.createElement("p");
                notaIngredientes.textContent = "La receta no tiene ningún ingrediente.";
                contenedor.append(notaIngredientes);
            }

        }

        if (!this.editando && this.tareas.length > 0) {
            const btnProgreso = document.createElement("button");
            btnProgreso.className = "btn btn-lg my-3 btn-estado-tarea mx-2";
            btnProgreso.textContent = "Ver progreso";
            btnProgreso.addEventListener("click", () => iniciarModoCocina());

            const btnComenzar = document.createElement("button");
            btnComenzar.className = "btn btn-lg btn-success my-3 mx-2";
            btnComenzar.textContent = "Empezar Receta";
            btnComenzar.addEventListener("click", () => {
                const respuesta = consulta("Atención", "Empezar la receta borrará tu progreso actual y comenzará desde cero. ¿Desea continuar?")
                    .then((respuesta) => {
                        if (respuesta) {
                            for (const tarea of this.tareas) {
                                tarea.completado = false;
                            }
                            this.verDetalle();
                            guardarRecetas();
                            iniciarModoCocina();
                        }
                    });
            });
            contenedor.append(btnProgreso, btnComenzar);
        }


        const tituloPasos = document.createElement("h3");
        tituloPasos.textContent = "Pasos a seguir";
        contenedor.append(tituloPasos);

        if (this.tareas.length > 0) {
            const listaTareas = document.createElement("ul");
            listaTareas.className = "row g-4";
            listaTareas.id = "lista-pasos";
            this.tareas.forEach(tarea => {
                listaTareas.append(tarea.obtenerElementoTarea(this.editando));
            });
            contenedor.append(listaTareas);
        }
        else {
            const notaPasos = document.createElement("p");
            notaPasos.textContent = "Esta receta no tiene ningún paso.";
            contenedor.append(notaPasos);
        }


        if (this.editando) {
            const agregarPasoBtn = document.createElement("button");
            agregarPasoBtn.textContent = "+ Agregar Paso";
            agregarPasoBtn.className = `btn d-block btn-agregar-paso`;

            agregarPasoBtn.addEventListener("click", () => {
                const tarea = new Tarea(this.obtenerTareaId(), "", "", "", false);
                const resultado = tarea.iniciar()
                    .then((resultado) => {
                        this.agregarTarea(tarea);
                        capturarDatosFormulario();
                        this.verDetalle();
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            });

            contenedor.append(agregarPasoBtn);
        }

        const editarBtn = document.createElement("button");
        editarBtn.textContent = this.editando ? "Guardar Cambios" : "Editar Receta";
        editarBtn.className = `btn ${this.editando ? "btn-guardar-receta" : "btn-editar-receta"}`;
        editarBtn.addEventListener("click", () => {
            if (this.editando) {
                capturarDatosFormulario();
            }
            this.editando = !this.editando;
            this.verDetalle();
        });

        contenedor.append(editarBtn);

        mostrarVista("vista-detalle");
    }

    crearFilaIngrediente(valor = "") {
        const fila = document.createElement("div");
        fila.className = "input-group mb-2";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "form-control input-ingrediente";
        input.placeholder = "Ej: 60 ml de leche";
        input.value = valor;
        fila.append(input);

        const btnBorrar = document.createElement("button");
        btnBorrar.type = "button";
        btnBorrar.className = "btn btn-outline-danger";
        btnBorrar.textContent = "❌";
        btnBorrar.addEventListener("click", () => fila.remove());
        fila.append(btnBorrar);

        return fila;
    }

}

class Tarea {
    id = 0;
    nombre = "";
    descripcion = "";
    tip = "";
    completado = false;

    constructor(id, nombre, descripcion, tip = "", completado = false) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tip = tip;
        this.completado = completado;
    }

    obtenerElementoTarea(modoEdicion) {
        const tarea = document.createElement("div");
        tarea.id = `tarea_${this.id}`;
        tarea.className = "tarjeta-paso position-relative";
        if (this.completado) {
            tarea.classList.add("tarjeta-paso-completada");

            const badge = document.createElement("span");
            badge.className = "position-absolute top-0 translate-middle p-2 bg-success border border-light rounded-circle text-white";
            badge.style.left = "10%";
            badge.style.fontSize = "1rem";
            badge.textContent = "COMPLETADO";
            tarea.append(badge);
        }

        const titulo = document.createElement("h4");
        titulo.classList.add("h3", "nombre-tarea");
        titulo.textContent = this.nombre;
        tarea.append(titulo);

        const descripcion = document.createElement("p");
        descripcion.textContent = this.descripcion;
        tarea.append(descripcion);

        if (this.tip != "") {
            const tip = document.createElement("p");
            tip.textContent = `💡Tip: ${this.tip}`;
            tarea.append(tip);
        }

        if (modoEdicion) {
            const footer = document.createElement("footer");
            const editBtn = document.createElement("button");
            editBtn.textContent = "Editar";
            editBtn.className = "btn-editar-tarea";
            editBtn.addEventListener("click", () => this.editar());
            footer.append(editBtn);
            const borrarBtn = document.createElement("button");
            borrarBtn.textContent = "Eliminar";
            borrarBtn.className = "btn-eliminar-tarea";
            borrarBtn.addEventListener("click", () => this.eliminar());
            footer.append(borrarBtn);
            tarea.append(footer);
        }

        return tarea;
    }


    eliminar() {
        const tarea = document.querySelector(`#tarea_${this.id}`);
        tarea.remove();

        if (recetaSeleccionada) {
            recetaSeleccionada.eliminarTarea(this.id);
            guardarRecetas();
        }
    }

    editar() {
        const dial = document.createElement("dialog");
        dial.className = "mi-modal";
        dial.style.margin = "auto";

        const div = document.createElement("div");
        //div.className = "modal-dialog";

        const form = document.createElement("form");
        form.autocomplete = false;
        const tituloModal = document.createElement("h2");
        tituloModal.textContent = `Editando: ${this.nombre}`;
        form.append(tituloModal);


        const labelNombre = document.createElement("label");
        labelNombre.textContent = "Nombre:";
        const inputNombre = document.createElement("input");
        inputNombre.type = "text";
        inputNombre.required = true;
        inputNombre.value = this.nombre;
        inputNombre.id = "inputNombre";
        labelNombre.htmlFor = inputNombre.id;
        form.append(labelNombre);
        form.append(inputNombre);

        const labelDesc = document.createElement("label");
        labelDesc.textContent = "Instrucción:";
        const inputDesc = document.createElement("textarea");
        inputDesc.value = this.descripcion;
        inputDesc.required = true;
        inputDesc.id = "inputDesc";
        labelDesc.htmlFor = inputDesc.id;
        form.append(labelDesc);
        form.append(inputDesc);

        const labelTip = document.createElement("label");
        labelTip.textContent = "Tip:";
        const inputTip = document.createElement("input");
        inputTip.type = "text";
        inputTip.value = this.tip;
        inputTip.id = "inputTip";
        labelTip.htmlFor = inputTip.id;
        form.append(labelTip);
        form.append(inputTip);


        const footer = document.createElement("footer");
        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancelar";
        cancelBtn.className = "btn-cancelar";
        cancelBtn.addEventListener("click", () => {
            dial.close();
            dial.remove();
        });
        footer.append(cancelBtn);
        const guardarBtn = document.createElement("button");
        guardarBtn.type = "submit";
        guardarBtn.textContent = "Guardar Cambios";
        guardarBtn.className = "btn-confirmar";
        footer.append(guardarBtn);

        form.addEventListener("submit", (evento) => {
            evento.preventDefault();
            this.nombre = inputNombre.value.trim();
            this.descripcion = inputDesc.value.trim();
            this.tip = inputTip.value.trim();

            guardarRecetas();

            const tareaVieja = document.querySelector(`#tarea_${this.id}`);
            tareaVieja.replaceWith(this.obtenerElementoTarea(true));

            dial.close();
            dial.remove();
        });

        form.append(footer);
        div.append(form);



        dial.append(div);

        document.body.append(dial);
        dial.showModal();
    }

    iniciar() {
        return new Promise((resolver, rechazar) => {
            const dial = document.createElement("dialog");
            dial.className = "mi-modal";
            dial.style.margin = "auto";

            const div = document.createElement("div");
            //div.className = "modal-dialog";

            const form = document.createElement("form");
            form.autocomplete = false;
            const tituloModal = document.createElement("h2");
            tituloModal.textContent = `Nueva Tarea`;
            form.append(tituloModal);


            const labelNombre = document.createElement("label");
            labelNombre.textContent = "Nombre:";
            const inputNombre = document.createElement("input");
            inputNombre.type = "text";
            inputNombre.required = true;
            inputNombre.value = this.nombre;
            inputNombre.id = "inputNombre";
            labelNombre.htmlFor = inputNombre.id;
            form.append(labelNombre);
            form.append(inputNombre);

            const labelDesc = document.createElement("label");
            labelDesc.textContent = "Instrucción:";
            const inputDesc = document.createElement("textarea");
            inputDesc.value = this.descripcion;
            inputDesc.required = true;
            inputDesc.id = "inputDesc";
            labelDesc.htmlFor = inputDesc.id;
            form.append(labelDesc);
            form.append(inputDesc);

            const labelTip = document.createElement("label");
            labelTip.textContent = "Tip:";
            const inputTip = document.createElement("input");
            inputTip.type = "text";
            inputTip.value = this.tip;
            inputTip.id = "inputTip";
            labelTip.htmlFor = inputTip.id;
            form.append(labelTip);
            form.append(inputTip);


            const footer = document.createElement("footer");
            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.textContent = "Cancelar";
            cancelBtn.className = "btn-cancelar";
            cancelBtn.addEventListener("click", () => {
                dial.close();
                dial.remove();
                rechazar("Se canceló la acción");
            });
            footer.append(cancelBtn);
            const GuardarBtn = document.createElement("button");
            GuardarBtn.type = "submit";
            GuardarBtn.className = "btn-confirmar";
            GuardarBtn.textContent = "Añadir Tarea";
            footer.append(GuardarBtn);

            form.addEventListener("submit", (evento) => {
                evento.preventDefault();
                this.nombre = inputNombre.value.trim();
                this.descripcion = inputDesc.value.trim();
                this.tip = inputTip.value.trim();
                dial.close();
                dial.remove();
                resolver("Se creó correctamente");
            });

            form.append(footer);
            div.append(form);



            dial.append(div);

            document.body.append(dial);
            dial.showModal();
        });

    }

}

// listeners botones

document.querySelectorAll(".dropdown-item").forEach(filtro => {
    filtro.addEventListener("click", () => {
        filtroActual = filtro.textContent == "Todos"? "": filtro.textContent;
        renderizarRecetas(filtroActual);
    });
});

document.querySelector("#atajo-crear").addEventListener("click", () => {
    Receta.crearReceta()
        .then((receta) => {
            recetas.push(receta);
            guardarRecetas();
            renderizarRecetas(filtroActual);
        })
        .catch((error) => {
            console.log(error);
        });
})


document.querySelector("#btn-nueva-receta").addEventListener("click", () => {
    Receta.crearReceta()
        .then((receta) => {
            recetas.push(receta);
            guardarRecetas();
            renderizarRecetas(filtroActual);
        })
        .catch((error) => {
            console.log(error);
        });
});


document.querySelector("#btn-volver-catalogo").addEventListener("click", () => {
    recetaSeleccionada.editando = false;
    recetaSeleccionada = null;
    mostrarVista("vista-catalogo");
});

document.querySelector("#btn-paso-anterior").addEventListener("click", () => {
    if (indicePasoActual > 0) {
        indicePasoActual--;
        renderizarPasoCocina();
    }
});

document.querySelector("#btn-paso-siguiente").addEventListener("click", () => {
    const totalPasos = recetaSeleccionada.tareas.length;
    if (indicePasoActual < totalPasos - 1) {
        indicePasoActual++;
        renderizarPasoCocina();
    } else {
        notificacion("¡Receta completada!", "Toca aceptar para volver al menú principal.")
            .then(() => {
                mostrarVista("vista-catalogo");
            });
    }
});

document.querySelector("#btn-salir-cocina").addEventListener("click", () => {
    mostrarVista("vista-detalle");
});

function mostrarVista(vistaId) {
    const vistas = ["vista-catalogo", "vista-detalle", "vista-cocina"];
    vistas.forEach(id => {
        const elemento = document.getElementById(id);
        if (id == vistaId) {
            elemento.classList.remove("d-none");
        }
        else {
            elemento.classList.add("d-none");
        }
    });
}

function iniciarModoCocina() {
    if (!recetaSeleccionada.tareas || recetaSeleccionada.tareas.length == 0) {
        notificacion("Esta receta no tiene pasos para realizar.", "Intenta llenar la receta con instrucciones para comenzar.");
        return;
    }

    indicePasoActual = 0;
    limpiarVistaCocina();
    renderizarPasoCocina();
    mostrarVista("vista-cocina");
}

function renderizarRecetas(filtro = "") {
    const selectorFiltros = document.querySelector("#selector-filtros");
    const tutorial = document.querySelector("#tutorial");
    const filtroLabel = document.querySelector("#filtro-actual");
    if (filtro != "") {
        tutorial.classList.add("d-none");
        filtroLabel.textContent = `Filtro Seleccionado: ${filtroActual}`;
        filtroLabel.classList.remove("d-none");
        selectorFiltros.classList.add("active");
    }
    else {
        tutorial.classList.remove("d-none");
        filtroLabel.classList.add("d-none");
        selectorFiltros.classList.remove("active");
    }
    const catalogo = document.querySelector("#catalogo");
    catalogo.innerHTML = "";
    if (recetas.length > 0) {
        for (const receta of recetas.filter(receta => receta.dificultad == filtro || filtro == "")) {
            const elemento = document.createElement("li");
            elemento.className = "col-12 col-md-6 col-lg-4";
            elemento.append(receta.obtenerElementoReceta());
            catalogo.append(elemento);
        }

        if (catalogo.children.length == 0) {
            const notaFiltro = document.createElement("p");
            notaFiltro.textContent = "No tenés ninguna receta en esta dificultad.";
            catalogo.append(notaFiltro);
        }
    }
    else {
        const nota = document.createElement("p");
        nota.className = "text-center";
        nota.textContent = "¡No tienes ninguna receta creada!\nToca el botón de arriba para empezar.";
        catalogo.append(nota);
    }

}

function renderizarPasoCocina() {
    const tareaActual = recetaSeleccionada.tareas[indicePasoActual];
    const totalPasos = recetaSeleccionada.tareas.length;

    // actualizar texto de progreso
    document.querySelector("#cocina-progreso").textContent = `Paso ${indicePasoActual + 1} de ${totalPasos}`;
    const actualizarProgreso = () => {
        const barra = document.querySelector("#progreso-receta");
        barra.ariaValueMax = totalPasos;
        const tareasCompletadas = recetaSeleccionada.tareas.reduce((tareasCompletadas, tarea) => {
            if (tarea.completado) {
                tareasCompletadas++;
                return tareasCompletadas;
            }
            else {
                return tareasCompletadas;
            }
        }, 0);
        barra.ariaValueNow = tareasCompletadas;
        barra.firstElementChild.style = `width: ${tareasCompletadas / totalPasos * 100}%`;
    };

    actualizarProgreso();
    limpiarVistaCocina();

    // renderizar paso actual
    const contenedorPaso = document.querySelector("#cocina-paso-actual");

    const nombreTarea = document.createElement("h2");
    nombreTarea.textContent = tareaActual.nombre;
    nombreTarea.className = "mb-2";
    contenedorPaso.append(nombreTarea);

    const instruccion = document.createElement("p");
    instruccion.textContent = tareaActual.descripcion;
    contenedorPaso.append(instruccion);

    if (tareaActual.tip != "") {
        const tip = document.createElement("p");
        tip.textContent = `💡Tip: ${tareaActual.tip}`;
        contenedorPaso.append(tip);
    }

    const estadoDiv = document.createElement("div");

    const estadoToggle = document.createElement("input");
    estadoToggle.type = "checkbox";
    estadoToggle.className = "form-check-input form-check-inline";
    estadoToggle.id = "estado-toggle";
    estadoToggle.checked = tareaActual.completado;

    estadoToggle.addEventListener("click", () => {
        tareaActual.completado = estadoToggle.checked;
        actualizarProgreso();
        const tareaVieja = document.querySelector(`#tarea_${tareaActual.id}`);
        tareaVieja.replaceWith(tareaActual.obtenerElementoTarea(false));
        guardarRecetas();
    });

    const estadoLabel = document.createElement("label");
    estadoLabel.textContent = "Tarea Completada";
    estadoLabel.htmlFor = "estado-toggle";
    estadoLabel.className = "form-label btn btn-lg btn-estado-tarea";

    estadoDiv.append(estadoToggle, estadoLabel);

    contenedorPaso.append(estadoDiv);

    // deshabilito boton en el paso 1
    const btnAnterior = document.querySelector("#btn-paso-anterior");
    btnAnterior.disabled = (indicePasoActual === 0);

    // cambio texto en el ultimo paso
    const btnSiguiente = document.querySelector("#btn-paso-siguiente");
    if (indicePasoActual === totalPasos - 1) {
        btnSiguiente.textContent = "Finalizar";
        btnSiguiente.className = "btn btn-cocina-siguiente btn-success";
    } else {
        btnSiguiente.textContent = "Siguiente";
        btnSiguiente.className = "btn btn-cocina-siguiente btn-primary";
    }
}

function limpiarVistaCocina() {
    document.querySelector("#cocina-paso-actual").innerHTML = "";
}

function notificacion(titulo, mensaje) {
    return new Promise((ejecutar, error) => {
        const dial = document.createElement("dialog");
        dial.className = "mi-modal notificacion";
        dial.style.margin = "auto";

        const div = document.createElement("div");
        //div.className = "modal-dialog";

        const tituloModal = document.createElement("h2");
        tituloModal.textContent = titulo;
        div.append(tituloModal);

        const texto = document.createElement("p");
        texto.textContent = mensaje;
        div.append(texto);

        const footer = document.createElement("footer");

        const aceptarBtn = document.createElement("button");
        aceptarBtn.textContent = "Aceptar";
        aceptarBtn.className = "btn-confirmar";
        aceptarBtn.addEventListener("click", () => {
            dial.close();
            dial.remove();
            ejecutar("OK");
        });
        footer.append(aceptarBtn);


        div.append(footer);
        dial.append(div);
        document.body.append(dial);
        dial.showModal();
    });
}

function consulta(titulo, mensaje) {
    return new Promise((resolver, rechazar) => {
        const dial = document.createElement("dialog");
        dial.className = "mi-modal consulta";
        dial.style.margin = "auto";

        const div = document.createElement("div");

        const tituloModal = document.createElement("h2");
        tituloModal.textContent = titulo;
        div.append(tituloModal);

        const texto = document.createElement("p");
        texto.textContent = mensaje;
        div.append(texto);

        const footer = document.createElement("footer");
        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancelar";
        cancelBtn.className = "btn-cancelar";
        cancelBtn.addEventListener("click", () => {
            dial.close();
            dial.remove();
            resolver(false);
        });
        footer.append(cancelBtn);
        const ConfirmarBtn = document.createElement("button");
        ConfirmarBtn.textContent = "Aceptar";
        ConfirmarBtn.className = "btn-confirmar";
        footer.append(ConfirmarBtn);

        ConfirmarBtn.addEventListener("click", () => {
            dial.close();
            dial.remove();
            resolver(true);
        });

        div.append(footer);
        dial.append(div);
        document.body.append(dial);
        dial.showModal();
    });

}

function guardarRecetas() {
    localStorage.setItem("recetas", JSON.stringify(recetas));
}

function cargarRecetas() {
    const datos = localStorage.getItem("recetas");

    if (datos) {
        const recetasGuardadas = JSON.parse(datos);

        recetas = recetasGuardadas.map(r => {
            const tareasInstanciadas = (r.tareas || []).map(t => {
                return new Tarea(t.id, t.nombre, t.descripcion, t.tip, t.completado);
            });

            return new Receta(r.id, r.nombre, r.ingredientes || [], tareasInstanciadas, r.dificultad);
        });

        const maxId = recetas.reduce((max, r) => Math.max(max, r.id), -1);
        Receta.contadorRecetas = maxId;
    }
    else {
        for (const obj_receta of OBJ_RECETAS) {
            recetas.push(new Receta(Receta.obtenerRecetaId(), obj_receta.nombre, obj_receta.ingredientes, obj_receta.tareas, obj_receta.dificultad));
        }
        guardarRecetas();
    }
}

let intento = false;

window.addEventListener("beforeinstallprompt", (evento) => {
    const $instalador = document.querySelector("#instalador");
    evento.preventDefault();

    $instalador.classList.remove("d-none");

    if (!intento) {
        $instalador.addEventListener("click", () => {
            evento.prompt()
            .then(resultado => {
                if (resultado.outcome == "accepted") {
                    console.log("Instalación satisfactoria");
                    $instalador.parentElement.className = "d-none";
                }
                else {
                    console.log("Se canceló la instalación");
                }
                $instalador.parentElement.className = "d-none";
            })
        });
        intento = true;
    }
});



const TEST_TAREAS = [

    // CAFÉ CON LECHE
    {
        id: 0,
        nombre: "Prepará el espresso",
        descripcion: "Hacé un espresso y colocá el café en una taza grande.",
        tip: "Usá café recién molido para obtener mejor sabor."
    },

    {
        id: 1,
        nombre: "Calentá la leche",
        descripcion: "Calentá aproximadamente 120 ml de leche sin dejar que llegue a hervir.",
        tip: "La leche debe estar caliente, pero no hirviendo."
    },

    {
        id: 2,
        nombre: "Agregá la leche",
        descripcion: "Verté lentamente la leche caliente sobre el espresso.",
        tip: "Hacelo de a poco para mezclar bien los sabores."
    },

    {
        id: 3,
        nombre: "Serví el café",
        descripcion: "Completá la taza y serví el café con leche inmediatamente.",
        tip: "Podés agregar azúcar si lo preferís más dulce."
    },


    // CAPPUCCINO
    {
        id: 4,
        nombre: "Prepará el espresso",
        descripcion: "Hacé un espresso y colocá el café en una taza para cappuccino.",
        tip: "Un espresso intenso combina muy bien con la leche."
    },

    {
        id: 5,
        nombre: "Calentá la leche",
        descripcion: "Calentá aproximadamente 60 ml de leche sin dejar que hierva.",
        tip: "Evitá que la leche hierva para conservar su textura."
    },

    {
        id: 6,
        nombre: "Espumá la leche",
        descripcion: "Usá un espumador hasta obtener una espuma cremosa y con burbujas pequeñas.",
        tip: "La espuma debe quedar firme pero suave."
    },

    {
        id: 7,
        nombre: "Agregá la leche",
        descripcion: "Verté la leche caliente lentamente sobre el espresso.",
        tip: "Dejá espacio para colocar la espuma."
    },

    {
        id: 8,
        nombre: "Añadí la espuma",
        descripcion: "Colocá la espuma de leche por encima hasta completar la taza.",
        tip: "Podés espolvorear un poco de cacao o canela."
    },


    // CAFÉ IRLANDÉS
    {
        id: 9,
        nombre: "Prepará el café",
        descripcion: "Hacé aproximadamente 120 ml de café fuerte y colocálo en una taza o vaso resistente al calor.",
        tip: "Un café intenso ayuda a equilibrar el sabor del whisky."
    },

    {
        id: 10,
        nombre: "Añadí el azúcar",
        descripcion: "Agregá una cucharadita de azúcar y mezclá hasta que se disuelva.",
        tip: "Podés usar azúcar rubia para un sabor más intenso."
    },

    {
        id: 11,
        nombre: "Agregá el whisky",
        descripcion: "Incorporá aproximadamente 30 ml de whisky y mezclá suavemente.",
        tip: "No agregues demasiado whisky para mantener el equilibrio."
    },

    {
        id: 12,
        nombre: "Prepará la crema",
        descripcion: "Batí ligeramente la crema de leche hasta que quede espesa pero todavía fluida.",
        tip: "No la batas demasiado: debe poder colocarse sobre el café."
    },

    {
        id: 13,
        nombre: "Colocá la crema",
        descripcion: "Verté lentamente la crema sobre la parte posterior de una cuchara para formar una capa sobre el café.",
        tip: "La crema debe quedar flotando sobre el café."
    },


    // MOCHA
    {
        id: 14,
        nombre: "Prepará el espresso",
        descripcion: "Hacé un espresso y colocálo en una taza grande.",
        tip: "Elegí un café de sabor intenso."
    },

    {
        id: 15,
        nombre: "Agregá el chocolate",
        descripcion: "Incorporá una cucharada de cacao en polvo o chocolate derretido y mezclá bien con el espresso.",
        tip: "El chocolate amargo combina muy bien con el café."
    },

    {
        id: 16,
        nombre: "Calentá la leche",
        descripcion: "Calentá aproximadamente 120 ml de leche sin dejar que hierva.",
        tip: "La leche caliente ayuda a integrar el chocolate."
    },

    {
        id: 17,
        nombre: "Agregá la leche",
        descripcion: "Verté lentamente la leche caliente sobre la mezcla de café y chocolate.",
        tip: "Mezclá suavemente para obtener una bebida uniforme."
    },

    {
        id: 18,
        nombre: "Decorá el mocha",
        descripcion: "Colocá un poco de espuma de leche o crema batida por encima y decorá con cacao.",
        tip: "No hace falta agregar demasiada crema para disfrutar el sabor del café."
    },


    // CAFÉ BOMBÓN
    {
        id: 19,
        nombre: "Prepará el espresso",
        descripcion: "Hacé un espresso y reserválo caliente.",
        tip: "Un espresso recién preparado permite apreciar mejor las capas."
    },

    {
        id: 20,
        nombre: "Agregá la leche condensada",
        descripcion: "Colocá aproximadamente 30 ml de leche condensada en el fondo de un vaso de vidrio.",
        tip: "Usá un vaso transparente para que se vean las diferentes capas."
    },

    {
        id: 21,
        nombre: "Añadí el espresso",
        descripcion: "Verté lentamente el espresso sobre la leche condensada.",
        tip: "Verté el café despacio para conservar las capas."
    },

    {
        id: 22,
        nombre: "Agregá espuma de leche",
        descripcion: "Colocá una pequeña cantidad de espuma de leche en la parte superior.",
        tip: "Este paso es opcional, pero aporta una textura más cremosa."
    },

    {
        id: 23,
        nombre: "Decorá el café",
        descripcion: "Espolvoreá un poco de cacao o canela por encima y serví inmediatamente.",
        tip: "No mezcles antes de servir para conservar el efecto de las capas."
    }

];


const OBJ_RECETAS = [

    {
        nombre: "Café con Leche",

        ingredientes: [
            "1 espresso",
            "120 ml de leche",
            "Azúcar a gusto"
        ],

        tareas: [
            new Tarea(TEST_TAREAS[0].id, TEST_TAREAS[0].nombre, TEST_TAREAS[0].descripcion, TEST_TAREAS[0].tip),
            new Tarea(TEST_TAREAS[1].id, TEST_TAREAS[1].nombre, TEST_TAREAS[1].descripcion, TEST_TAREAS[1].tip),
            new Tarea(TEST_TAREAS[2].id, TEST_TAREAS[2].nombre, TEST_TAREAS[2].descripcion, TEST_TAREAS[2].tip),
            new Tarea(TEST_TAREAS[3].id, TEST_TAREAS[3].nombre, TEST_TAREAS[3].descripcion, TEST_TAREAS[3].tip)
        ],

        dificultad: "Fácil"
    },


    {
        nombre: "Cappuccino",

        ingredientes: [
            "1 espresso",
            "60 ml de leche",
            "Cacao o canela a gusto"
        ],

        tareas: [
            new Tarea(TEST_TAREAS[4].id, TEST_TAREAS[4].nombre, TEST_TAREAS[4].descripcion, TEST_TAREAS[4].tip),
            new Tarea(TEST_TAREAS[5].id, TEST_TAREAS[5].nombre, TEST_TAREAS[5].descripcion, TEST_TAREAS[5].tip),
            new Tarea(TEST_TAREAS[6].id, TEST_TAREAS[6].nombre, TEST_TAREAS[6].descripcion, TEST_TAREAS[6].tip),
            new Tarea(TEST_TAREAS[7].id, TEST_TAREAS[7].nombre, TEST_TAREAS[7].descripcion, TEST_TAREAS[7].tip),
            new Tarea(TEST_TAREAS[8].id, TEST_TAREAS[8].nombre, TEST_TAREAS[8].descripcion, TEST_TAREAS[8].tip)
        ],

        dificultad: "Media"
    },


    {
        nombre: "Café Irlandés",

        ingredientes: [
            "120 ml de café fuerte",
            "30 ml de whisky",
            "1 cucharadita de azúcar",
            "30 ml de crema de leche"
        ],

        tareas: [
            new Tarea(TEST_TAREAS[9].id, TEST_TAREAS[9].nombre, TEST_TAREAS[9].descripcion, TEST_TAREAS[9].tip),
            new Tarea(TEST_TAREAS[10].id, TEST_TAREAS[10].nombre, TEST_TAREAS[10].descripcion, TEST_TAREAS[10].tip),
            new Tarea(TEST_TAREAS[11].id, TEST_TAREAS[11].nombre, TEST_TAREAS[11].descripcion, TEST_TAREAS[11].tip),
            new Tarea(TEST_TAREAS[12].id, TEST_TAREAS[12].nombre, TEST_TAREAS[12].descripcion, TEST_TAREAS[12].tip),
            new Tarea(TEST_TAREAS[13].id, TEST_TAREAS[13].nombre, TEST_TAREAS[13].descripcion, TEST_TAREAS[13].tip)
        ],

        dificultad: "Media"
    },


    {
        nombre: "Mocha",

        ingredientes: [
            "1 espresso",
            "120 ml de leche",
            "1 cucharada de cacao o chocolate",
            "Crema batida a gusto"
        ],

        tareas: [
            new Tarea(TEST_TAREAS[14].id, TEST_TAREAS[14].nombre, TEST_TAREAS[14].descripcion, TEST_TAREAS[14].tip),
            new Tarea(TEST_TAREAS[15].id, TEST_TAREAS[15].nombre, TEST_TAREAS[15].descripcion, TEST_TAREAS[15].tip),
            new Tarea(TEST_TAREAS[16].id, TEST_TAREAS[16].nombre, TEST_TAREAS[16].descripcion, TEST_TAREAS[16].tip),
            new Tarea(TEST_TAREAS[17].id, TEST_TAREAS[17].nombre, TEST_TAREAS[17].descripcion, TEST_TAREAS[17].tip),
            new Tarea(TEST_TAREAS[18].id, TEST_TAREAS[18].nombre, TEST_TAREAS[18].descripcion, TEST_TAREAS[18].tip)
        ],

        dificultad: "Difícil"
    },


    {
        nombre: "Café Bombón",

        ingredientes: [
            "1 espresso",
            "30 ml de leche condensada",
            "Espuma de leche a gusto",
            "Cacao o canela"
        ],

        tareas: [
            new Tarea(TEST_TAREAS[19].id, TEST_TAREAS[19].nombre, TEST_TAREAS[19].descripcion, TEST_TAREAS[19].tip),
            new Tarea(TEST_TAREAS[20].id, TEST_TAREAS[20].nombre, TEST_TAREAS[20].descripcion, TEST_TAREAS[20].tip),
            new Tarea(TEST_TAREAS[21].id, TEST_TAREAS[21].nombre, TEST_TAREAS[21].descripcion, TEST_TAREAS[21].tip),
            new Tarea(TEST_TAREAS[22].id, TEST_TAREAS[22].nombre, TEST_TAREAS[22].descripcion, TEST_TAREAS[22].tip),
            new Tarea(TEST_TAREAS[23].id, TEST_TAREAS[23].nombre, TEST_TAREAS[23].descripcion, TEST_TAREAS[23].tip)
        ],

        dificultad: "Difícil"
    }

];

let recetas = [];
let filtroActual = "";
let recetaSeleccionada = null;
let indicePasoActual = 0;


function main() {

    cargarRecetas();
    renderizarRecetas(filtroActual);

}




main();