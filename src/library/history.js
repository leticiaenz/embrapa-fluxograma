// Singleton to Stack to Manage History

let states = [];
let currentStateIndex = 0;
const limit = 50;

const history = {
  saveState: function(obj) {
    if (currentStateIndex > limit) {
      currentStateIndex -= 1;
      states.shift();
    }

    states.splice(currentStateIndex, states.length);
    states.push(JSON.stringify(obj));
    currentStateIndex = currentStateIndex + 1;
  },
  canRedo: function() {
    return currentStateIndex < states.length ? true : false;
  },
  redo: function() {
    if (currentStateIndex < states.length) currentStateIndex += 1;
  },
  canUndo() {
    return currentStateIndex > 1 ? true : false;
  },
  undo: function() {
    if (currentStateIndex > 1) currentStateIndex -= 1;
  },
  getState: function() {
    return JSON.parse(states[currentStateIndex - 1]);
  },
  getAllStates: function() {
    return states;
  },
  currentIndex: function() {
    return currentStateIndex;
  },
  clean: function() {
    states.splice(0, states.length);
    currentStateIndex = 0;
  }
};

Object.freeze(history);
export default history;
