const socket = require("socket.io-client");
const Uid = require("./uid");

/**
 * @typedef Body
 * @property {string} auditorium
 * @property {number} statusCode
 * @property {string} status
 * @property {Object} response
 *
 */

/**
 * @typedef Response
 * @property {string}  name
 * @property {Body[]}  body
 */

/**
 * @typedef CustomError
 * @property {string}  name
 * @property {string}  message
 * @property {Body[]}  body
 */

/**
 * @type {ReturnType<import('socket.io-client')>}
 */
let ioClient;

let isConnect = false;

function connector({ signalcUrl } = {}) {
  return new Promise((resolve, reject) => {
    try {
      ioClient = socket(signalcUrl);
      ioClient.on("connect", () => {
        isConnect = true;
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * @param {{name:string, body:Object}} param0
 * @returns {Promise<Response>}
 */
function emit({ name, body } = {}) {
  return new Promise((resolve, reject) => {
    if (!isConnect) {
      throw new Error("Gateway not connected yet.");
    }
    let uid = Uid.uuidv4();
    ioClient.emit("notify", {
      notify: {
        name,
        body
      },
      uid
    });

    ioClient.on(`${uid}:success`, listeners => {
      ioClient.off(`${uid}:success`);
      ioClient.off(`${uid}:fail`);
      resolve(listeners);
    });
    ioClient.on(`${uid}:fail`, error => {
      ioClient.off(`${uid}:success`);
      ioClient.off(`${uid}:fail`);
      reject(error);
    });
  });
}

emit()
  .then()
  .catch();

module.exports = Object.freeze({
  connector,
  emit
});
