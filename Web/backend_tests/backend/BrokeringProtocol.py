from autobahn.asyncio.websocket import WebSocketServerProtocol
# or: from autobahn.asyncio.websocket import WebSocketServerProtocol
from SeleniumSession import Session

class Broker(object):
    def __init__(self):
        self.publishers = {}
        self.subscribers = {}

        self.sessions = {}

    def register(self, client, session, width, height):
        self.publishers.update({client: session})
        if self.subscribers.get(session) == None:
            self.subscribers[session] = []
        self.subscribers[session].append(client)
        if session not in self.sessions:
            # Start a new session
            self.sessions[session] = Session(sessionID = session, width = width, height = height)



    def publishMessage(self, client, payload):
        topic = self.publishers.get(client)

        # First update the current session
        sess = self.sessions.get(topic)
        sess.apply_update(payload)

        # Then broadcast the update to all the subscribers
        self.broadcastUpdate(topic, payload)

    def broadcastUpdate(self, topic, update):
        subscribers = self.subscribers[topic]
        for subscriber in subscribers:
            subscriber.sendMessage(update, False)

    def initiate(self, client):
        # send the canvas state as an update
        topic = self.publishers[client]
        session = self.sessions.get(topic)
        initial_update = session.get_state_for_canvases(['drawable_canvas', 'background_canvas'])
        import json
        json_update = json.dumps(initial_update)
        client.sendMessage(json_update, False)

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
        broker.register(self, request.params['sessionID'][0], request.params['width'][0], request.params['height'][0])

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