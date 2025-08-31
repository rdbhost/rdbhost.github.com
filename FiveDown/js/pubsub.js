// js/pubsub.js

class PubSub {
  constructor() {
    this.topics = {};
  }

  subscribe(topic_name, func) {
    if (!this.topics[topic_name]) this.topics[topic_name] = [];
    this.topics[topic_name].push(func);
  }

  publish(topic_name, message) {
    setTimeout(() => {
      if (this.topics[topic_name]) {
        for (let func of this.topics[topic_name]) {
          func(message);
        }
      }
    }, 0);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pubsub = new PubSub();
  const table = document.querySelector('table#main-sheet');
  if (table) table.pubsub = pubsub;
});

export { PubSub };