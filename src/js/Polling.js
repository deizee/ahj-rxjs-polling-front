import { interval, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, map, mergeMap, timestamp } from 'rxjs/operators';

export default class Polling {
  constructor(container) {
    this.container = container;
    this.messagesIdContainer = [];
  }

  init() {
    this.bindToDOM();
    this.registerEvents();
    this.subscribeOnStreams();
  }

  bindToDOM() {
    const template = this.markup();
    this.container.insertAdjacentHTML('afterbegin', template);
    this.messageContainer = this.container.querySelector('.polling__content');
  }

  markup() {
    return `
      <div class='polling'>
        <div class='polling__header'>
          <h1 class='polling__title'>Polling</h1>
          <h1 class='polling__controls'>
            <button class='button__unsubscribe'>Unsubscribe</button>
            <button class='button__subscribe'>Subscribe</button>
          </h1>
        </div>
        <div class='polling__content'></div>
      </div>
    `;
  }

  registerEvents() {
    this.subscribeBtn = this.container.querySelector('.button__subscribe');
    this.unsubscribeBtn = this.container.querySelector('.button__unsubscribe');

    this.subscribeBtn.addEventListener('click', () => this.subscribeOnStreams());
    this.unsubscribeBtn.addEventListener('click', () => this.unsubscribeOnStreams());
  }

  subscribeOnStreams() {
    this.messageStream$ = interval(2000)
      .pipe(
        mergeMap(() =>
          ajax.getJSON('https://deizee-ahj-polling.herokuapp.com/messages/unread').pipe(
            map((response) => {
              const filteredResponse = response.messages.filter(
                (message) => !this.messagesIdContainer.includes(message.id)
              );
              filteredResponse.forEach((message) => this.messagesIdContainer.push(message.id));
              return filteredResponse;
            }),
            timestamp(),
            catchError(() =>
              of({
                value: [],
              })
            )
          )
        )
      )
      .subscribe((response) => {
        response.value.forEach((message) => this.addMessage(response.timestamp, message));
      });
  }

  unsubscribeOnStreams() {
    this.messagesIdContainer = [];
    this.messageStream$.unsubscribe();
  }

  addMessage(currentDate, message) {
    const newMessage = this.messageTemplate(currentDate, message);
    this.messageContainer.insertAdjacentHTML('afterbegin', newMessage);
  }

  messageTemplate(currentDate, message) {
    const sourceDate = new Date(currentDate);
    const date = `${sourceDate
      .toLocaleTimeString()
      .slice(0, 5)} ${sourceDate.toLocaleDateString()}`;
    return `
      <div class='message' data-post-id='${message.id}'>
        <div class='message__body'>
          <div class='message__from'>${message.from}</div>
          <div class='message__text'>${
            message.subject.length > 15 ? `${message.subject.slice(0, 15)}...` : message.subject
          }</div>
          <div class='message__received-data'>${date}</div>
        </div>
      </div>
    `;
  }
}
