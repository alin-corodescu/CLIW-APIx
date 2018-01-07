from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import base64

HTML = "file:////home/alin/CLIW-APIx/Web/backend_tests/index.html"

class Session:
    def __init__(self, sessionID, width, height):
        # One driver per session
        self.driver = webdriver.Chrome()
        self.driver.get(HTML)

        self.set_canvas_dimensions(width, height)

        self.id = sessionID

    # Returns a dictionary with a mapping of canvas_id to the data url of the current state of the canvas
    def get_state_for_canvases(self, canvas_id_list):
        return {canvas_id : self.get_canvas_state(canvas_id) for canvas_id in canvas_id_list}

    def get_canvas_state(self, canvas_id):
        canvas = self.driver.find_element_by_id(canvas_id)
        # get the canvas as a Data URL
        return self.driver.execute_script("return arguments[0].toDataURL('image/png');", canvas)


    def apply_update(self, json):
        # Update based on what we recieved from the json
        self.driver.execute_script("drawUpdate(arguments[0]);", json)

    def set_canvas_dimensions(self, width, height):
        self.driver.execute_script("setCanvasDimensions(arguments[0], arguments[1]);", width, height)
