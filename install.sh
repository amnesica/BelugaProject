#!/bin/bash
# Install script for the Beluga Project (Raspberry Pi only!)
# run with sudo privileges

set -euo pipefail

repo_name=BelugaProject
repo_url=https://github.com/amnesica/$repo_name/archive/refs/heads/master.zip
repo_zip_filename=$repo_name.zip

whiptail_title="Installation of the Beluga Project"

_get_master_repo(){
  wget $repo_url -O $repo_zip_filename
  unzip $repo_zip_filename
  mv $repo_name-master/ $repo_name
}

_show_whiptail_yes_no_box() {
  #sed -i '/LOCATION_LATITUDE=/c\LOCATION_LATITUDE=no' .env_test
  if whiptail --title "$whiptail_title" --yesno "$1" 8 78; then
    echo "continue" >/dev/null
  else
    echo "Installation process cancelled."
    exit 0
  fi
}

_install_docker_with_progress() {
  # using script from https://docs.docker.com/engine/install/debian/#install-using-the-convenience-script
  {
    sleep 0.5
    echo -e "XXX\n0\nGetting install script from docker.com... \nXXX"
    # curl -fsSL https://get.docker.com -o get-docker.sh
    sleep 0.1
    echo -e "XXX\n50\nGetting install script from docker.com... Done.\nXXX"
    sleep 0.5

    echo -e "XXX\n50\nInstalling docker... \nXXX"
    # sudo sh get-docker.sh
    sleep 0.1
    echo -e "XXX\n100\nInstalling docker... Done.\nXXX"
    sleep 0.5
  } | whiptail --title "$whiptail_title" --gauge "Please wait while installing docker" 6 50 0
}

_check_for_docker() {
  if command -v docker &> /dev/null # TODO reinsert ! before command
  then
    _show_whiptail_yes_no_box "The Beluga Project uses docker and docker compose. Click 'yes' to install docker"

    _install_docker_with_progress
  fi
}

_install(){
  _show_whiptail_yes_no_box "Welcome to the installation of the Beluga Project. Would you like to continue?"

  _check_for_docker




}

_install