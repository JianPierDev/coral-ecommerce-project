// Variables
const body = document.querySelector('BODY')
const overlay = document.querySelector('.overlay')
const productoContenedor = document.querySelector('#products-container')
const shoppingCartResult = document.querySelector('#shopping-cart__result')
const contenedorCarrito = document.querySelector('#list-cart tbody')
const formulario = document.querySelector('#form')
const registroBtn = document.querySelector('#account')
const buscador = document.querySelector('#search-product')
const resultadoBusquedas = document.querySelector('#search-results')

let productos = []
let articulosCarrito = JSON.parse(localStorage.getItem('carrito')) || []

window.addEventListener('load', () => {
    menuMovil()
    crearHTML() 
    consumirAPI()
    configurarFiltros()

    if (buscador) configurarBuscador()
    if (document.querySelector('#container-product-selected')) consumirAPIDetalle()
    if (shoppingCartResult) renderizarPaginaCarrito()
    if (registroBtn) registroBtn.onclick = mostrarModalFormulario
})

document.addEventListener('click', e => {
    const target = e.target
    const id = target.dataset.id

    // Agrega el producto
    if (target.classList.contains('btn-cart') && target.hasAttribute('data-id')) {
        e.preventDefault()

        const productoEncontrado = productos.find(p => p.id == id)
        
        if (productoEncontrado) {
            const info = {
                img: productoEncontrado.image,
                titulo: productoEncontrado.title,
                precio: productoEncontrado.price,
                id: String(productoEncontrado.id),
                cantidad: 1
            }
            gestionarLogicaCarrito(info)
            mostrarMensaje(info)
        }
    }

    // Limpia el carrito
    if (target.classList.contains('empty-cart')) {
        e.preventDefault()

        articulosCarrito = []
        actualizarTodo()
    }

    // Elimina un elemento del carrito
    if (target.classList.contains('borrar-producto')) {
        e.preventDefault()

        articulosCarrito = articulosCarrito.filter(producto => producto.id !== id)
        actualizarTodo()
    }

    // Actualiza las cantidades dentro del carrito header
    if (target.classList.contains('plus')) {
        const producto = articulosCarrito.find(item => item.id === id)
        if (producto && producto.cantidad < 10) {
            producto.cantidad++
            actualizarTodo()
        }
    }

    if (target.classList.contains('rest')) {
        const producto = articulosCarrito.find(item => item.id === id)
        if (producto && producto.cantidad > 1) { 
            producto.cantidad--
            actualizarTodo() 
        }
    }

})

// Modal para cuando el usuario agrega un producto
function mostrarMensaje(infoProducto) {
    const mensaje = document.querySelector('#message')
    const contenedorMensaje = document.querySelector('.message__body-info')

    if(!mensaje || !contenedorMensaje) return

    const productoActual = articulosCarrito.find(producto => producto.id === infoProducto.id)
    let cantidad = productoActual ? productoActual.cantidad : 1

    contenedorMensaje.innerHTML = `
        <img width="100" src="${infoProducto.img}">
        <p>${infoProducto.titulo}</p>
        <p class="precio-total">$${(infoProducto.precio * cantidad).toFixed(2)}</p>
        
        <div class="amount">
            <div class="amount-top">
                <button class="btn-stepper rest-modal" data-id="${infoProducto.id}">-</button>
                <span class="cant-num">${cantidad}</span>
                <button class="btn-stepper plus-modal" data-id="${infoProducto.id}">+</button>
            </div>
        </div>
    `

    // Apertura el modal
    overlay.classList.remove('hidden')
    mensaje.classList.remove('hidden')
    body.classList.add('overflow-hidden')

    // Actualiza la cantidad dentro del modal
    contenedorMensaje.querySelector('.plus-modal').onclick = () => {
        if(productoActual.cantidad < 10) {
            productoActual.cantidad++
            actualizarUIModal()
        }
    }

    contenedorMensaje.querySelector('.rest-modal').onclick = () => {
        if(productoActual.cantidad > 1) {
            productoActual.cantidad--
            actualizarUIModal()
        }
    }

    function actualizarUIModal() {
        contenedorMensaje.querySelector('.cant-num').textContent = productoActual.cantidad
        contenedorMensaje.querySelector('.precio-total').textContent = `$${(productoActual.precio * productoActual.cantidad).toFixed(2)}`
        actualizarTodo()
    }

    // Efecto de animación
    const btnCloseModal = document.querySelector('.message__footer')
    if(btnCloseModal) {
        btnCloseModal.onclick = () => {
            mensaje.style.opacity = '0'
            overlay.style.opacity = '0'

            setTimeout(() => {
                mensaje.classList.add('hidden')
                overlay.classList.add('hidden')
                body.classList.remove('overflow-hidden')
                
                mensaje.style.opacity = ''
                overlay.style.opacity = ''
            }, 300)
        }
    }
}

// Carrito del header
function crearHTML() {
    if (!contenedorCarrito) return
    limpiarHTML(contenedorCarrito)

    if (articulosCarrito.length === 0) {
        contenedorCarrito.innerHTML = '<tr><td colspan="5" class="msg-cart">🛒 Vacio</td></tr>'
    } else {
        articulosCarrito.forEach(p => {
            const row = document.createElement('tr')

            row.innerHTML = `
                <td><img height="40" src="${p.img}"></td>
                <td>${p.titulo.substring(0,10)}...</td>
                <td>$${p.precio.toFixed(2)}</td>
                <td>${p.cantidad}</td>
                <td><button class="borrar-producto" data-id="${p.id}">X</button></td>
            `

            contenedorCarrito.appendChild(row)
        })
    }

    const cartActions = document.querySelector('.cart-actions')

    if (cartActions) {
        
        cartActions.innerHTML = `
            <div class="btns-card-hover">
                <a href="cart.html" class="btn-cart">Go to cart</a>
                <a href="#" class="btn-cart empty-cart">Empty cart</a>
            </div>
        `
    }
}

// Funciones para cart.hmtl
function renderizarPaginaCarrito() {
    if (!shoppingCartResult) return
    const resumen = document.querySelector('.shopping-cart__summary')

    if (articulosCarrito.length === 0) {
        shoppingCartResult.classList.add('empty')
        shoppingCartResult.innerHTML = `
            <p>Your cart is empty</p>
            <a href="index.html">Return to the home page</a>
        `
        if (resumen) resumen.style.display = 'none'
        return
    }

    shoppingCartResult.classList.remove('empty')
    
    if (resumen) resumen.style.display = 'block'

    let html = `
        <div class="cart-column-title">Image</div>
        <div class="cart-column-title">Description</div>
        <div class="cart-column-title">Price Unit.</div>
        <div class="cart-column-title">Sub Total</div>
        <div class="cart-column-title">Cant</div>
        <div class="cart-column-title">Delete</div>
    `

    articulosCarrito.forEach(item => {
        html += `
            <img width="80" src="${item.img}" alt="${item.titulo}">            
            <p class="titulo">${item.titulo}</p>
            <p class="shopping-cart-precio">$${item.precio.toFixed(2)}</p>
            <p class="shopping-cart-subtotal">$${(item.precio * item.cantidad).toFixed(2)}</p>
            
            <div class="stepper">
                <button class="btn-stepper rest" data-id="${item.id}">-</button>
                <span class="cantidad">${item.cantidad}</span>
                <button class="btn-stepper plus" data-id="${item.id}">+</button>
            </div>

            <button class="btn-stepper--red borrar-producto" data-id="${item.id}">X</button>
        `
    })

    shoppingCartResult.innerHTML = html
    actualizarResumen(resumen)
}

function actualizarResumen(contenedorResumen) {
    if (!contenedorResumen) return
    const total = articulosCarrito.reduce((acumulador, p) => acumulador + (p.precio * p.cantidad), 0)
    contenedorResumen.innerHTML = `
        <div>
            <h3>Summary</h3>
            <div>
                <span>Total Order:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <button class="btn-cart">Checkout Now</button>
        </div>
    `
}

async function consumirAPI() {
    try {
        const res = await fetch('https://fakestoreapi.com/products')
        productos = await res.json()
        if (productoContenedor) mostrarProductos(productos)
    } catch (error) {
        console.error("Error API:", error)
    }
}

function mostrarProductos(lista) {
    if (!productoContenedor) return
    productoContenedor.innerHTML = lista.map(p => `
        <div class="product">
            <a class="product__href" href="./product.html?id=${p.id}">
                <img class="product__image" src='${p.image}' alt="${p.title}">
            </a>
            <div class="product__text">
                <h3 class="product__title">${p.title}</h3>
                <div class="product-footer">
                    <p class="product__price">$${p.price.toFixed(2)}</p>
                    <a class="btn-cart" href="#" data-id="${p.id}">Add to Cart</a>
                </div>
            </div>
        </div>`).join('')
}

function gestionarLogicaCarrito(info) {
    const existe = articulosCarrito.find(x => x.id === info.id)
    if (existe) { 
        existe.cantidad += info.cantidad
        if(existe.cantidad > 10) existe.cantidad = 10
    } else { articulosCarrito.push(info) }
    actualizarTodo()
}

function consumirAPIDetalle() {
    const id = new URLSearchParams(window.location.search).get("id")

    if (!id) return

    fetch(`https://fakestoreapi.com/products/${id}`)
        .then(response => response.json())
        .then(data => {
            const cont = document.querySelector('#container-product-selected')
            if(!cont) return
            
            let cantS = 1

            cont.innerHTML = `
                <div class="product-selected__image">
                    <img src="${data.image}" alt="${data.title}">
                </div>
                <div class="product-selected__description">
                    <h2>${data.title}</h2>
                    <p class="price">$${data.price.toFixed(2)}</p>
                    <p class="product-info-description">${data.description}</p>
                    
                    <div class="product-controls">
                        <div class="amount">
                            <button class="btn-stepper" id="detail-minus">-</button>
                            <span id="detail-cant">${cantS}</span>
                            <button class="btn-stepper" id="detail-plus">+</button>
                        </div>
                        <button class="btn-cart" id="add-to-cart-detail">Add to Cart</button>
                    </div>
                </div>`

            // Lógica de botones integrada (reemplaza a la función que daba error)
            const btnPlus = document.querySelector('#detail-plus')
            const btnMinus = document.querySelector('#detail-minus')
            const btnAdd = document.querySelector('#add-to-cart-detail')
            const cantDisplay = document.querySelector('#detail-cant')

            if (btnPlus) {
                btnPlus.onclick = () => {
                    if (cantS < 10) {
                        cantS++
                        cantDisplay.textContent = cantS
                    }
                }
            }

            if (btnMinus) {
                btnMinus.onclick = () => {
                    if (cantS > 1) {
                        cantS--
                        cantDisplay.textContent = cantS
                    }
                }
            }

            if (btnAdd) {
                btnAdd.onclick = (e) => {
                    e.preventDefault()
                    const info = {
                        img: data.image,
                        titulo: data.title,
                        precio: data.price,
                        id: String(data.id),
                        cantidad: cantS 
                    }
                    gestionarLogicaCarrito(info)
                    mostrarMensaje(info)
                }
            }
        })
        .catch(error => console.error("Error al cargar detalle:", error))
}

// Buscador de productos
function configurarBuscador() {
    buscador.oninput = (e) => {
        const textoIngresado  = e.target.value.trim().toLowerCase()

        if ( textoIngresado === '') {
            resultadoBusquedas.classList.add('hidden')
            return
        }

        resultadoBusquedas.classList.remove('hidden')

        const respuesta = productos.filter(producto => producto.title.toLowerCase().includes(textoIngresado))
        resultadoBusquedas.innerHTML = respuesta.map(i => `<a class="product-search" href="./product.html?id=${i.id}">${i.title}</a>`).join('')
    }
}

// Auxiliares
function actualizarTodo() {
    localStorage.setItem('carrito', JSON.stringify(articulosCarrito))
    crearHTML()
    if(shoppingCartResult) renderizarPaginaCarrito()
}

function limpiarHTML(contenedorCarrito) { 
    while (contenedorCarrito.firstChild) {
        contenedorCarrito.removeChild(contenedorCarrito.firstChild)
    }
}

function menuMovil() {
    const b = document.querySelector('.hamburger')
    const n = document.querySelector('#nav')
    if (b && n) {
        b.onclick = () => n.classList.toggle('nav--open')
    }
}

function mostrarModalFormulario() {
    if(!formulario || !overlay) return

    formulario.classList.remove('hidden', 'fade-out')
    overlay.classList.remove('hidden', 'fade-out')
    
    formulario.classList.add('fade-in')
    overlay.classList.add('fade-in')
    body.classList.add('overflow-hidden')

    // Cerrar formulario
    const btnCloseForm = document.querySelector('#btn-close')
    
    const cerrarModal = () => {
        formulario.classList.remove('fade-in')
        overlay.classList.remove('fade-in')
        formulario.classList.add('fade-out')
        overlay.classList.add('fade-out')

        setTimeout(() => {
            formulario.classList.add('hidden')
            overlay.classList.add('hidden')
            body.classList.remove('overflow-hidden')
            
            formulario.classList.remove('fade-out')
            overlay.classList.remove('fade-out')
        }, 450)
    }

    if(btnCloseForm) {
        btnCloseForm.onclick = cerrarModal
    }

    overlay.onclick = cerrarModal
}

function configurarFiltros() {
    const botonesFiltro = document.querySelectorAll('.filters button')
    botonesFiltro.forEach(boton => {
        boton.onclick = (e) => {
            botonesFiltro.forEach(btn => btn.classList.remove('active'))
            e.target.classList.add('active')

            const categoria = e.target.dataset.category
            filtrarProductos(categoria)
        }
    })
}

function filtrarProductos(categoria) {
    if (!productos.length) return

    if (categoria === 'all') {
        mostrarProductos(productos)
    } else {
        const filtrados = productos.filter(p => p.category === categoria)
        mostrarProductos(filtrados)
    }
}