#!/bin/zsh

if [ -z "$1" ]
then
  echo "No new folder name provided"
  exit 1
fi

echo "Cloning p5sketch-template into $1..."
# Clone the template repo into a new folder
git clone https://github.com/conceptblend/p5sketch-template.git $1

echo "Removing git connection from template..."

# Remove the connection to the template repo
cd $1 && rm -rf .git/

echo "Done!"

exit 0