// app.js - cria as tiles a partir de cars.json


async function loadCars(){
try{
const res = await fetch('cars.json');
if(!res.ok) throw new Error('Falha ao carregar cars.json: '+res.status);
const cars = await res.json();
renderGrid(cars);
}catch(err){
console.error(err);
document.getElementById('cars-grid').innerHTML = '<p style="padding:20px">Erro ao carregar dados.</p>';
}
}


function renderGrid(cars){
const grid = document.getElementById('cars-grid');
grid.innerHTML = '';
cars.forEach(car => {
const btn = document.createElement('button');
btn.className = 'car-tile';
btn.setAttribute('aria-label', `Ver ${car.name}`);
btn.style.backgroundImage = `url(${car.image})`;
btn.dataset.id = car.id;


const label = document.createElement('div');
label.className = 'car-label';
label.innerHTML = `<h3>${car.name}</h3><small>${car.brand} • ${car.year}</small>`;


btn.appendChild(label);


btn.addEventListener('click', ()=>{
// navegar para página de detalhe
window.location.href = `car.html?id=${encodeURIComponent(car.id)}`;
});


btn.addEventListener('keydown', (e)=>{
if(e.key === 'Enter' || e.key === ' ') btn.click();
});


grid.appendChild(btn);
});
}


// iniciar
loadCars();