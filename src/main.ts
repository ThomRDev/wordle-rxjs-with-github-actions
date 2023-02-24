import './style.css';
import { fromEvent, Subscription } from 'rxjs';
import { map, filter, mergeWith, } from 'rxjs/operators';

import WORD_LIST from './word-list.json'

let currentRowIndex = 0
let currentLetterIndex = 0

let userAnswer:string[] = []
let rightAnswer:string = ''

const rowsElms = Array.from(document.querySelectorAll('.table__row'))
const cellsElms = Array.from(document.querySelectorAll('.table__cell'))
const notificationElm = document.getElementById('notification')

const getRandomWord = () => {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
}

const onKeyDown$ = fromEvent<KeyboardEvent>(document,'keydown')
                  .pipe(
                    map(event=>({ type: event.code, key: event.key.trim() })),
                  )
const onEnter$ = onKeyDown$.pipe(
  filter(value=>value.key == 'Enter' && currentRowIndex < 6)
)

const onKeyletter$ = onKeyDown$.pipe(
  filter(value=>value.key.length === 1 &&  value.key.match(/[a-z]/i) != null && currentLetterIndex < 5 ),
  map(value => value.key.toUpperCase())
)

const onKeyBackSpace$ = onKeyDown$.pipe(
  filter(value=>value.key == 'Backspace' && currentLetterIndex > 0)
)

const onLoad$ = fromEvent(window,'load')
const onRestart$ = fromEvent(document.getElementById('restart')!,'click').pipe(
  map(()=>'restart')
)

const startGame$ = onLoad$.pipe(
  mergeWith(onRestart$)
)

const insertLetter = {
  next: (letter:string) => {
    notificationElm!.textContent = ''
    const cell = rowsElms[currentRowIndex].children[currentLetterIndex]
    
    cell.textContent = letter
    cell.classList.add("filled-letter");
    
    userAnswer.push(letter)
    currentLetterIndex++
  }
}

const deleteLetter = {
  next:() => {
    const cell = rowsElms[currentRowIndex].children[currentLetterIndex - 1]
    
    cell.textContent = ''
    cell.classList.remove("filled-letter");
    userAnswer.pop()
    currentLetterIndex--
  }
}

const changeRow = {
  next : () => {
    const userWord = userAnswer.join('')
    
    if(currentLetterIndex != 5) {
      notificationElm!.textContent = userAnswer.length === 4 ? "Te falta 1 letra" : `Te faltan ${5 - userAnswer.length} letras`;
      return;
    }

    if (!WORD_LIST.includes(userAnswer.join(""))) {
      notificationElm!.textContent = `¡La palabra ${userAnswer
        .join("")
        .toUpperCase()} no está en la lista!`;
    }
    const cells = rowsElms[currentRowIndex].children;
    
    userAnswer.forEach((letter,index) => {
      
      let style = ''
      if(letter == rightAnswer[index]) {
        style = 'letter-green'
      }else{
        style = rightAnswer.indexOf(letter) != -1 ?  'letter-yellow' : 'letter-grey'
      }
      cells[index].classList.add(style)
    })


    if(userWord === rightAnswer){
      notificationElm!.textContent = `😊 ¡Sí! La palabra ${rightAnswer.toUpperCase()} es la correcta`;
      return;
    }else{
      currentLetterIndex = 0
      currentRowIndex++
      userAnswer = []
    }
  }
}

let subcriptionOnEnter:Subscription | null  = null
let subcriptionOnKeyLetter:Subscription | null  = null
let subcriptionBackSpace:Subscription | null = null

startGame$.subscribe((val)=> {

  document.getElementById('restart')!.blur()

  if(val == 'restart') {
    subcriptionOnEnter?.unsubscribe()
    subcriptionOnKeyLetter?.unsubscribe()
    subcriptionBackSpace?.unsubscribe()
  }
  rightAnswer = getRandomWord()
  userAnswer = []

  currentRowIndex = 0
  currentLetterIndex = 0
  notificationElm!.textContent = ''

  cellsElms.forEach(cellElm => {
    cellElm.setAttribute('class', 'table__cell');
    cellElm.textContent = ''
  })

  subcriptionOnEnter = onEnter$.subscribe(changeRow)
  subcriptionOnKeyLetter = onKeyletter$.subscribe(insertLetter)
  subcriptionBackSpace = onKeyBackSpace$.subscribe(deleteLetter)
})


