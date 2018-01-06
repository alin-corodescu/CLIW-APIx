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

    def store_state_for_canvases(self, canvas_id_list):
        for canvas_id in  canvas_id_list:
            self.save_canvas_state(canvas_id)

    def save_canvas_state(self, canvas_id):
        canvas = self.driver.find_element_by_id(canvas_id)

        # get the canvas as a PNG base64 string
        canvas_base64 = self.driver.execute_script("return arguments[0].toDataURL('image/png').substring(21);", canvas)

        # decode
        canvas_png = base64.b64decode(canvas_base64)

        # save to a file
        import os
        if not (os.path.exists(str(id)) and os.path.isdir(str(id))):
            os.mkdir(str(id))

        with open(os.path.join(str(id), canvas_id), 'wb') as f:
            f.write(canvas_png)

    def apply_update(self, json):
        # Update based on what we recieved from the json
        self.driver.execute_script("drawUpdate(arguments[0]);", json)

    def set_canvas_dimensions(self, width, height):
        self.driver.execute_script("setCanvasDimensions(arguments[0], arguments[1]);", width, height)
