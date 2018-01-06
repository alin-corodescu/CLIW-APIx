import sys
from flask import Flask
import asyncio

from BrokeringProtocol import BrokeringProtocol

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'


if __name__ == '__main__':
    # websockets.serve(hello_world, 'localhost', 5000)

    # log.startLogging(sys.stdout)

    from autobahn.asyncio.websocket import WebSocketServerFactory

    factory = WebSocketServerFactory()
    factory.protocol = BrokeringProtocol

    loop = asyncio.get_event_loop()
    coro = loop.create_server(factory, '127.0.0.1', 5000)
    server = loop.run_until_complete(coro)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.close()
        loop.close()
    # app.run()

