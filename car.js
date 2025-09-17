// car.js - car.html


function getParam(name){
return new URLSearchParams(location.search).get(name);
}


async function loadCar(){
const id = getParam('id');
if(!id){ document.getElementById('car-name').textContent = 'Carro não especificado'; return }
try{
const res = await fetch('cars.json');
if(!res.ok) throw new Error('Falha ao carregar JSON');
const cars = await res.json();
const car = cars.find(c=>String(c.id)===String(id));
if(!car){ document.getElementById('car-name').textContent = 'Carro não encontrado'; return }


document.getElementById('car-name').textContent = car.name;
const main = document.getElementById('car-main');


const hero = document.createElement('div');
hero.className = 'car-hero';
hero.style.backgroundImage = `url(${car.image})`;


const desc = document.createElement('div');
desc.innerHTML = `<h2>${car.brand} — ${car.year}</h2><p>${car.description || ''}</p>`;


const specs = document.createElement('div');
specs.className = 'specs';
if(car.specs){
Object.entries(car.specs).forEach(([k,v])=>{
const s = document.createElement('div'); s.className = 'spec'; s.innerHTML = `<strong>${k}</strong><div>${v}</div>`; specs.appendChild(s);
})
}


main.innerHTML = '';
main.appendChild(hero);
main.appendChild(desc);
main.appendChild(specs);


}catch(err){ console.error(err); document.getElementById('car-name').textContent = 'Erro ao carregar'; }
}


// botão de voltar
const back = document.getElementById('back');
if(back) back.addEventListener('click', ()=> history.back());


loadCar();