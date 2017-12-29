from autobahn.asyncio.websocket import WebSocketServerProtocol
# or: from autobahn.asyncio.websocket import WebSocketServerProtocol
modifications = []
clients = set()
class ServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {}".format(request.peer))
        clients.add(self)

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        if isBinary:
            print("Binary message received: {} bytes".format(len(payload)))
        else:
            print("Text message received: {}".format(payload.decode('utf8')))
        modifications.append(payload)
        # echo back message verbatim
        for client in clients:
            for modification in modifications:
                client.sendMessage(modification, isBinary)
        # self.sendMessage(payload, isBinary)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {}".format(reason))
        clients.remove(self)