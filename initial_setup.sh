#!/bin/bash

export ME="kallan"

if [[ ! -f /starscream ]]; then
	sudo mkdir /starscream/
	sudo chown $ME:$ME /starscream/
	sudo cp /home/$ME/starscream-v3/initial_setup.sh /starscream/
fi

if [[ ! -f "/etc/rc.local" ]]; then
	sudo touch /etc/rc.local
	sudo bash -c 'echo -e "#!/bin/sh -e\n/starscream/initial_setup.sh &\nexit 0" > /etc/rc.local'
	sudo chmod 755 /etc/rc.local
	sudo systemctl enable rc-local.service
	sudo systemctl start rc-local.service
	echo "created rc.local"
fi

if [[ ! -f "/starscream/setup.log" ]]; then
	sudo touch /starscream/setup.log
	sudo chown $ME:$ME /starscream/setup.log
	sudo echo "start" > /starscream/setup.log
fi

case $(tail -n 1 /starscream/setup.log) in
	"start")
		sudo apt update
		sudo apt full-upgrade -y
		sudo echo "initial updates" > /starscream/setup.log
		sudo reboot
		;;
	"initial updates")
		wget https://www.flightaware.com/adsb/piaware/files/packages/pool/piaware/f/flightaware-apt-repository/flightaware-apt-repository_1.2_all.deb -P /starscream/
		sudo dpkg -i /starscream/flightaware-apt-repository_1.2_all.deb
		
		sudo apt update
		sudo apt install piaware -y

		sudo piaware-config allow-auto-updates yes
		sudo piaware-config allow-manual-updates yes

		sudo apt install dump1090-fa -y
		sudo apt install dump978-fa -y
		sudo apt install nodejs npm -y

		sudo echo "piaware and dump installed" > /starscream/setup.log
		sudo reboot
		;;
	"piaware and dump installed")
		sudo systemctl enable dump1090-fa
		sudo systemctl restart dump1090-fa
		sudo systemctl enable dump978-fa
		sudo systemctl restart dump978-fa
		sudo systemctl enable piaware
		sudo systemctl restart piaware

		sudo echo "piaware services enabled" > /starscream/setup.log
		;;
	"piaware services enabled")
		cp /home/$ME/starscream-v3/.env.default /home/$ME/starscream-v3/.env.local
		cd /home/$ME/starscream-v3/
		npm run build
		npm start
		sudo apt install firefox -y
		firefox --kiosk http://localhost:3000
	*)
		echo "this script is broken, delete setup.log at /var/run/setup.log"
		;;
esac
