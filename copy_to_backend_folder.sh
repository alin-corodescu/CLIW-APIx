#!/bin/bash

# This script will copy all the necessary files from the Website
# folder into the backend, so the webserver serve them
set +x


rm Backend/static/js/*
rm Backend/static/css/*
rm Backend/static/resources/*

cp -r Website/js Backend/static/ 
cp -r Website/css Backend/static/
cp -r Website/resources Backend/static/

cp Website/*.html Backend/templates/



