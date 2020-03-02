#/bin/sh

mkdir -p ./conf/ws
mkdir -p ./data/images
mkdir -p ./data/db

cp ./code/ws/conf/imanno.yaml ./conf/ws/
cp ./db/db.sample.db ./data/db/imanno.db

sed -i 's+../db/db.sample.db+/data/db/imanno.db+g' ./conf/ws/imanno.yaml
sed -i 's+../sample-images+/data/images+g'  ./conf/ws/imanno.yaml 

echo ""
echo ""

echo "Setup complete..."
echo "Please open conf/ws/imanno.yml and update the label list before running."

echo ""
echo ""
