import asyncio

from BrokeringProtocol import BrokeringProtocol

if __name__ == '__main__':
    from autobahn.asyncio.websocket import WebSocketServerFactory

    factory = WebSocketServerFactory()
    factory.protocol = BrokeringProtocol

    loop = asyncio.get_event_loop()
    coro = loop.create_server(factory, host=None, port=5000)
    server = loop.run_until_complete(coro)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.close()
        loop.close()
