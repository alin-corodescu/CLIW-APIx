from autobahn.asyncio.websocket import WebSocketServerProtocol
# or: from autobahn.asyncio.websocket import WebSocketServerProtocol
class Broker(object):
    def __init__(self):
        self.publishers = {}
        self.subscribers = {}
        self.topics = {}

    def register(self, client, session):
        self.publishers.update({client: session})
        if self.subscribers.get(session) == None:
            self.subscribers[session] = []
        self.subscribers[session].append(client)


    def publishMessage(self, client, payload):
        topic = self.publishers.get(client)
        if self.topics.get(topic) == None:
            self.topics[topic] = []
        self.topics[topic].append(payload)
        self.broadcastUpdates(topic)

    def broadcastUpdates(self, topic):
        subscribers = self.subscribers[topic]
        for subscriber in subscribers:
            subscriber.sendMessage(self.topics[topic][-1], False)

    def initiate(self, client):
        session = self.publishers[client]
        if self.topics.get(session) != None:
            for message in self.topics[session]:
                client.sendMessage(message, False)

    def removeClient(self, client):
        # Get the session of the client
        session = self.publishers.get(client)
        del self.publishers[client]

        # Get the clients subscribed to this topic
        clients = self.subscribers[session]

        # Remove the client from this topic
        clients.remove(client)


broker = Broker()

class BrokeringProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {}".format(request.peer))
        broker.register(self, request.params['sessionID'][0])

    def onOpen(self):
        print("WebSocket connection open.")
        broker.initiate(self)

    def onMessage(self, payload, isBinary):
        if isBinary:
            print("Binary message received: {} bytes".format(len(payload)))
        else:
            print("Text message received: {}".format(payload.decode('utf8')))
        broker.publishMessage(self, payload)
        # self.sendMessage(payload, isBinary)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {}".format(reason))
        broker.removeClient(self)
        # clients.remove(self)