import { createServer, Server } from 'http'
import { Server as IoServer } from 'socket.io'
import { generate, observe } from 'fast-json-patch'

export class WsStateServer<WsStateType> {
  #server: Server
  #io: IoServer
  #state: WsStateType

  constructor(port: number, initialState = {} as WsStateType, updateInterval = 1000 / 5) {
    this.#server = createServer()
    this.#io = new IoServer(this.#server, { cors: { origin: '*' } })

    this.#io.on('connection', socket => {
      socket.emit('init', this.#state)
    })

    this.#state = initialState

    const observer = observe<Object>(this.#state)
    setInterval(() => {
      const patch = generate(observer)
      if (patch.length) this.#io.emit('patch', patch)
    }, updateInterval)

    setTimeout(() => {
      this.#server.listen(port, '127.0.0.1')
      console.log('View server started on port:', port)
    }, 1)
  }

  close() {
    this.#io.close()
  }

  get state() { return this.#state }
}
