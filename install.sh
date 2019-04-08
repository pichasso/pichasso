# copy prebuild node modules
DIRECTORY="/usr/src/app/node_modules"
if [ -d "$DIRECTORY" ]; then
  echo "info: delete node_modules folder for installing prebuild node_modules again"
fi
if [ ! -d "$DIRECTORY" ]; then
  echo "install prebuild node_modules..."
	mv /usr/src/node_modules /usr/src/app/node_modules
fi
