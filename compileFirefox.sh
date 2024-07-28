#!/bin/bash

rm firefox.xpi
zip -r firefox.zip icons manifest.json nav.js
mv firefox.zip firefox.xpi
