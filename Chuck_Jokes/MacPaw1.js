'use strict';

let prevState = [];
let text = [];
const categoryOnClick = new Set();
const favourites = new Set();
const used = new Set();
const favourSet = new Set();
if (localStorage.length > 0) {
  text = JSON.parse(localStorage.getItem('text'));
}
const onGet = {
  'Ran': onGetRan,
  'From': onGetCat,
  'Sear': onGetSearch,
};
const ident = {
  'Ran': false,
  'From': false,
  'Sear': false,
};
const metods = {
  'Ran': () => undefined,
  'From': () => {},
  'Sear': () => {},
};

function httpRequest(fn, url) {
  const onReq = new XMLHttpRequest();
  onReq.addEventListener('load', fn);
  onReq.onreadystatechange = () => {
    if (onReq.readyState === XMLHttpRequest.DONE) {
      if (onReq.status !== 200) {
        const body = document.getElementsByTagName('body')[0];
        body.innerText = `Error code: ${onReq.status}
          Cannot get a joke
          Try to connect to server later`;
      }
    }
  };
  onReq.open('GET', url);
  onReq.send();
}

function reqListener() {
  metods['From'] = onCategoriesWrap(this.responseText);
}

/* when the page is downloaded, we need to take all categories
   and to restore previous state of favourites jokes */

document.addEventListener('DOMContentLoaded', () => {
  httpRequest(reqListener, 'https://api.chucknorris.io/jokes/categories');
  metods['Sear'] = onSearchWrap();
  preventer();
  text.forEach(el => onGetSearch(el, false));

  const body = document.getElementsByTagName('body')[0];
  body.onbeforeunload = () => {
    localStorage.clear();
    const arrOfFav = [];
    for (const el of favourSet.values()) {
      arrOfFav.push(el.lastChild.textContent);
    }
    localStorage.setItem('text', JSON.stringify(arrOfFav));
  };
});

// process onclick event on button "{category}"

function catOnClick(event) {
  const { color } = event.target.style;
  if (color !== 'rgb(51, 51, 51)') {
    event.target.style.backgroundColor = '#F8F8F8';
    event.target.style.color = '#333333';
    categoryOnClick.add(event.target.innerHTML);
  } else {
    event.target.style.backgroundColor = '#FFFFFF';
    event.target.style.color = '#ABABAB';
    categoryOnClick.delete(event.target.innerHTML);
  }
}

// create div element that contains all categories

function onCategoriesWrap(arr) {
  const array = JSON.parse(arr);
  const before = document.getElementById('Sear');
  const block = document.createElement('DIV');
  block.setAttribute('id', 'onCat');
  for (const category of array) {
    const btn = document.createElement('BUTTON');
    btn.innerHTML = category;
    btn.classList.add('category');
    btn.addEventListener('click', catOnClick);
    block.appendChild(btn);
  }
  return () => {
    if (ident['From']) {
      const toDel = document.getElementById('onCat');
      toDel.remove();
      return;
    }
    before.parentElement.insertBefore(block, before);
  };
}

// this function turns button's state

function onClick(id) {
  const curr = document.getElementById(id);
  const el = curr.children[0];

  if (!ident[id]) {
    el.style.visibility = 'visible';
    curr.style.borderColor = '#333333';
    metods[id]();
    for (const key in ident) {
      if (ident[key]) onClick(key);
    }
  } else {
    el.style.visibility = 'hidden';
    curr.style.borderColor = '#ABABAB';
    metods[id]();
  }
  ident[id] = !ident[id];
}

// to remove the favourite joke when 'heart' button is clicked

function butToRemove() {
  const text = this.parentElement.lastChild.textContent;
  const buttons = document.getElementById('buttons');
  for (let i = 0; i < buttons.children.length; i++) {
    const el = buttons.children[i];
    const joke = el.lastChild;
    if (joke && joke.textContent === text) {
      const button = el.children.length === 5 ? el.children[3] : el.children[4];
      button.click();
    }
  }
  this.parentElement.remove();
  favourSet.forEach(el => {
    if (el.lastChild.textContent === text) favourSet.delete(el);
  });
}

// create favourite joke

function createFavourites() {
  const divFav = document.getElementById('FavJokes');
  for (const el of used.values()) {
    if (!favourites.has(el)) {
      const text = el.lastChild.textContent;
      favourSet.forEach(arg => {
        if (arg.lastChild.textContent === text) {
          arg.remove();
          used.delete(el);
          favourSet.delete(arg);
        }
      });
    }
  }
  for (const el of favourites.values()) {
    if (used.has(el)) continue;
    used.add(el);
    const proto = el.cloneNode(true);
    proto.classList.add('protoEl');
    proto.lastChild.style.width = '350px';
    proto.lastChild.style.top = '30px';
    const button = proto.children.length === 5 ?
      proto.children[3] : proto.children[4];
    button.addEventListener('click', butToRemove);
    favourSet.add(proto);
    divFav.appendChild(proto);
  }
}

// process onclick event on 'heart' button of joke

function favOnClick(event) {
  let flag = false;
  const joke = event.target.parentElement;
  if (event.target.alt === 'notLiked') {
    event.target.src = 'liked.png';
    event.target.alt = 'liked';
    favourites.forEach(el => {
      if (el.lastChild.textContent === joke.lastChild.textContent) {
        favourites.delete(el);
        used.delete(el);
        flag = true;
      }
    });
    if (flag) {
      favourites.add(joke);
      used.add(joke);
      return;
    }
    favourites.add(joke);
    createFavourites();
  } else {
    event.target.src = 'notLiked.png';
    event.target.alt = 'notLiked';
    favourites.delete(joke);
    createFavourites();
  }
}

function createLikeButton() {
  const favBtn = document.createElement('IMG');
  favBtn.alt = 'notLiked';
  favBtn.src = 'notLiked.png';
  favBtn.addEventListener('click', favOnClick);
  favBtn.classList.add('favBtn');
  return favBtn;
}

function isFavourite(joke) {
  const text = joke.lastChild.textContent;
  favourSet.forEach(el => {
    if (el.lastChild.textContent === text) {
      const button = joke.children.length === 5 ?
        joke.children[3] : joke.children[4];
      button.click();
    }
  });
}

// to create joke's form

function appenderSimple(flag = true) {
  const jokeInfo = JSON.parse(this.responseText);
  if (jokeInfo.total) {
    for (let i = 0; i < jokeInfo.total; i++) {
      appenderToCreate(jokeInfo.result[i], flag);
    }
  } else {
    appenderToCreate(jokeInfo);
  }
}

function appenderToCreate(jokeInfo, flag = true) {
  const body = document.getElementById('buttons');
  const joke = document.createElement('DIV');
  joke.classList.add('joke');
  if (!jokeInfo.categories) return;
  if (jokeInfo.categories[0]) {
    const category = document.createElement('P');
    category.innerHTML = jokeInfo.categories[0];
    category.classList.add('categ');
    joke.appendChild(category);
  }
  const hours = Math.floor(
    (Date.now() - Date.parse(jokeInfo.updated_at)) / 3600000
  );
  const date = document.createElement('P');
  const favBtn = createLikeButton();
  const icon = document.createElement('IMG');
  const id = document.createElement('A');
  const text = document.createElement('P');
  text.innerHTML = jokeInfo.value;
  text.classList.add('text');
  date.innerHTML = `Last update: ${hours} hours ago`;
  date.classList.add('update');
  icon.classList.add('icon');
  icon.setAttribute('alt', 'nothing');
  icon.setAttribute('src', jokeInfo.icon_url);
  id.innerHTML = `ID: ${jokeInfo.id}`;
  id.classList.add('id');
  id.setAttribute('href', `${jokeInfo.url}`);
  [icon, id, date, favBtn, text].forEach(el => joke.appendChild(el));
  if (flag) {
    body.appendChild(joke);
    prevState.push(joke);
    isFavourite(joke);
  } else {
    const i = joke.children.length === 5 ? 0 : 1;
    const button = joke.children[3 + i];
    button.click();
  }
}

function onGetRan() {
  httpRequest(appenderSimple, 'https://api.chucknorris.io/jokes/random');
}

function onGetCat() {
  for (const value of categoryOnClick.values()) {
    httpRequest(appenderSimple, `https://api.chucknorris.io/jokes/random?category=${value}`);
  }
}

function append(flag, onlyOne = false) {
  return function appender() {
    const jokeInfo = JSON.parse(this.responseText);
    if (jokeInfo.total) {
      if (onlyOne) {
        appenderToCreate(jokeInfo.result[0], flag);
        return;
      }
      for (let i = 0; i < jokeInfo.total; i++) {
        appenderToCreate(jokeInfo.result[i], flag);
      }
    } else {
      appenderToCreate(jokeInfo);
    }
  };
}

function onGetSearch(value = '', flag = true) {
  let query = value.slice(0, 115);
  if (!query) {
    const text = document.getElementsByTagName('input')[0];
    query = text.value.slice(0, 115);
  }
  if (query) {
    let appender;
    text.length < 115 ? appender = append(flag, true) : append(flag);
    httpRequest(appender, `https://api.chucknorris.io/jokes/search?query=${query}`);
  }
}

// when button 'Get a joke' is clicked

function onGetClick() {
  for (const el of prevState) {
    el.remove();
    prevState = [];
  }
  for (const el in ident) {
    if (ident[el]) onGet[el]();
  }
}

// to prevent repeating onclick event

function preventer() {
  const getJokes = document.getElementById('get-jokes');
  let flag = true;
  getJokes.addEventListener('click', () => {
    if (flag) {
      onGetClick();
      flag = false;
      setTimeout(() => flag = true, 500);
    }
  });
}

// to create input field

function onSearchWrap() {
  const before = document.getElementById('get-jokes');
  const toPut = document.getElementById('buttons');
  const input = document.createElement('INPUT');
  let flag = true;
  input.onkeyup = ev => {
    if (ev.keyCode === 13) {
      if (flag) {
        onGetClick();
        flag = false;
        setTimeout(() => flag = true, 500);
      }
    }
  };
  const br = document.createElement('BR');
  br.id = 'brToDel';
  input.placeholder = 'Free text search...';
  return () => {
    const exist = document.getElementsByTagName('input');
    if (exist[0]) {
      exist[0].remove();
      document.getElementById('brToDel').remove();
      return;
    }
    toPut.insertBefore(input, before);
    toPut.insertBefore(br, before);
  };
}
