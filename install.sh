#!/bin/bash

# Install script for the Beluga Project
# run with sudo privileges

set -eu pipefail

REPO_NAME=BelugaProject
REPO_URL="https://github.com/amnesica/$REPO_NAME/archive/refs/heads/dev.zip" # TODO change to master again before deployment
REPO_ZIP_FILENAME=$REPO_NAME.zip
ENV_FILENAME=.env
WHIPTAIL_TITLE="Installation of the Beluga Project"

_show_whiptail_yes_no_box() { # params: $1:msg $2:width $3:height
  if whiptail --title "$WHIPTAIL_TITLE" --yesno "$1" $2 $3; then
    echo "continue" >/dev/null
  else
    echo "Installation process cancelled. If this was a mistake delete all downloaded files and start installation again."
    exit 0
  fi
}

_show_whiptail_msg_box() { # params: $1:msg $2:width $3:height
  whiptail --title "$WHIPTAIL_TITLE" --msgbox "$1" $2 $3
}

_show_whiptail_input_box() { # params: $1:msg $2:item_to_set $3:width $4:height
  INPUT_FROM_ENV_FILE=$(sed -n '/^'"$2"'=/ {s///p;q;}' $REPO_NAME/$ENV_FILENAME)
  INPUT=$(whiptail --inputbox "$1" $3 $4 $INPUT_FROM_ENV_FILE --title "$WHIPTAIL_TITLE" 3>&1 1>&2 2>&3)
  exitstatus=$?
  if [[ $exitstatus = 0 ]]; then
    sed -i '/'"$2"'/c\'"$2=$INPUT"'' $REPO_NAME/$ENV_FILENAME
  else
    echo "Installation process cancelled. If this was a mistake delete all downloaded files and start installation again."
    exit 0
  fi
}

_show_whiptail_menu_box_entry() { # params: $1:msg $2:height $3:width $4:listheight $5:tag items
  INPUT=$(whiptail --title "$WHIPTAIL_TITLE" --menu "$1" $2 $3 $4 "${@:5:4}" 3>&1 1>&2 2>&3)
  exitstatus=$?
  if [[ $exitstatus = 0 ]]; then
    if [[ $INPUT == "Install" ]]; then
      _install_entry
    elif [[ $INPUT == "Update" ]]; then
      _update_entry
    else
      echo "Invalid option. Process cancelled."
      exit 0
    fi
  else
    echo "Installation process cancelled. If this was a mistake delete all downloaded files and start installation again."
    exit 0
  fi
}

_install_docker_with_progress() {
  # using script from https://docs.docker.com/engine/install/debian/#install-using-the-convenience-script
  {
    sleep 0.5
    echo -e "XXX\n0\nGetting install script from docker.com... \nXXX"
    wget -qO get-docker.sh https://get.docker.com >/dev/null 2>&1 || exit
    sleep 0.1
    echo -e "XXX\n50\nGetting install script from docker.com... Done.\nXXX"
    sleep 0.5

    echo -e "XXX\n50\nInstalling docker... \nXXX"
    sudo sh get-docker.sh >/dev/null 2>&1 || exit
    sleep 0.1
    echo -e "XXX\n100\nInstalling docker... Done.\nXXX"
    sleep 0.5
  } | whiptail --title "$WHIPTAIL_TITLE" --gauge "Docker is getting installed" 8 100 0
}

_check_for_docker() {
  if ! command -v docker &>/dev/null; then
    _show_whiptail_yes_no_box "The Beluga Project uses docker and docker compose. Click 'yes' to install docker." 8 100

    _install_docker_with_progress
  fi
}

_download_repo_with_progress() {
  wget --progress=bar $REPO_URL -O $REPO_ZIP_FILENAME 2>&1 | grep "%" | sed -u -e "s,\.,,g" | awk '{print $2}' | sed -u -e "s,\%,,g" | whiptail --title "$WHIPTAIL_TITLE" --gauge "Downloading the Beluga Project..." 8 100 0
}

_unzip_repo_with_progress() {
  echo -e "XXX\n0\nUnzipping files... \nXXX"
  unzip $REPO_ZIP_FILENAME
  sleep 0.1
  echo -e "XXX\n33\nUnzipping files... Done.\nXXX"
  sleep 1
}

_rename_repo_with_progress() {
  echo -e "XXX\n33\nRenaming directory... \nXXX"
  mv $REPO_NAME-master/ $REPO_NAME
  sleep 0.1
  echo -e "XXX\n66\nRenaming directory... Done.\nXXX"
  sleep 1
}

_rename_env_template_with_progress() {
  echo -e "XXX\n66\nRenaming environment template file... \nXXX"
  sudo cp $REPO_NAME/$ENV_FILENAME.template $REPO_NAME/$ENV_FILENAME
  sleep 0.1
  echo -e "XXX\n100\nRenaming environment template file... Done.\nXXX"
  sleep 1
}

_prepare_repo_with_progress() {
  local title="Please wait while files are being prepared"
  {
    _unzip_repo_with_progress

    _rename_repo_with_progress

    _rename_env_template_with_progress

  } | whiptail --title "$WHIPTAIL_TITLE" --gauge "$title" 8 100 0
}

_set_env_values() {
  _show_whiptail_yes_no_box "The following will guide you through necessary and optional steps needed for running the Beluga Project. \
  \n\nWhen configuring multiple feeders the order of the entries is important. The first entries for ip address, type, name and color belong to the same feeder as well as the second and so on. \
  \n\nIf you miss to provide mandatory information the application start may fail or some features will not work properly. When you have multiple entries seperated by a comma do not use blank spaces like "entry,␣entry"." 16 100

  _show_whiptail_input_box "1) Set the LATITUDE of your feeder location. Later this will be the shown on the map with an antenna icon (example: 12.123456)" \
    "LOCATION_LATITUDE" 8 100

  _show_whiptail_input_box "2) Set the LONGITUDE of your feeder location. Later this will be the shown on the map with an antenna icon (example: 8.123456)" \
    "LOCATION_LONGITUDE" 8 100

  _show_whiptail_input_box "3) Enter the URLs of your feeders with an json output seperated by comma without any whitespace.
  \nIf you do not have a local feeder and just want to use Opensky-Network or Airplanes.Live leave the field empty and click 'OK'.\
  \n\n* for AirSquitter use the URL http://XXX.XXX.XXX.XX/aircraftlist.json \
  \n* for tar1090 use the URL http://XXX.XXX.XXX.XX/tar1090/data/aircraft.json \
  \n* for adsbx use the URL http://XXX.XXX.XXX.XX/adsbx/data/aircraft.json \
  \n* for fr24feeder (dump1090) use the URL http://XXX.XXX.XXX.XX/dump1090/data/aircraft.json \
  \n* for dump1090-fa use the URL http://XXX.XXX.XXX.XX/dump1090-fa/data/aircraft.json \
  \n* for vrs use the URL http://XXX.XXX.XXX.XX/VirtualRadar/AircraftList.json \
  \n\nExample with two feeders: http://192.168.123.10/aircraftlist.json,http://192.168.123.11/tar1090/data/aircraft.json" "FEEDER_IP" 20 100

  _show_whiptail_input_box "4) Enter the TYPE of your feeders seperated by comma without any whitespace. Currently supported: adsbx, airsquitter, dump1090-fa, fr24feeder, vrs.\
   \n\nIf you do not have a local feeder leave the field empty.\
   \n\nExample with two feeders: airsquitter,adsbx" "FEEDER_TYPE" 12 100

  _show_whiptail_input_box "5) Enter the NAME of your feeders seperated by comma without any whitespace. Name should not be too long to fit well in control elements.\
   \n\nIf you do not have a local feeder leave the field empty.\
   \n\nExample with two feeders: home1,home2" "FEEDER_NAME" 12 100

  _show_whiptail_input_box "6) Enter the COLOR of your feeders seperated by comma without any whitespace. This color is used later in statistical views.\
   \n\nIf you do not have a local feeder type "red" (or any color). A valid color is needed here! \
   \n\nExample with two feeders: red,blue" "FEEDER_COLOR" 12 100

  _show_whiptail_input_box "7) Enter the AMOUNT of your feeders seperated by comma without any whitespace.\
   \n\nThis value must match with the amount of feeder configuration entries.\
   \n\nIf you do not have a local feeder type '1'.\
   \n\nExample with two feeders: 2" "FEEDER_AMOUNT" 14 100

  _show_whiptail_input_box "8) Enter the desired amount and distance of RANGE_RINGS (values in nm) that are displayed on the map. Enter values seperated by comma and without any whitespace.\
   \n\nExample: 25,50,100,150,200" "CIRCLE_DISTANCE_OF_RINGS" 12 100

  _show_whiptail_input_box "9) Choose a PASSWORD for the database of the Beluga Project." "SPRING_DATASOURCE_PASSWORD" 8 100

  _show_whiptail_input_box "10) Enter the URL of your productive systems ip address (for a simple test you can use 'localhost')." "PROD_BASE_URL_WEBAPP" 8 100

  _show_whiptail_input_box "11) Optional: Enter your Opensky-Network USERNAME to use the Opensky-Network. If you do not provide credentials this function will be disabled." "OPENSKY_NETWORK_USERNAME" 8 100

  _show_whiptail_input_box "12) Optional: Enter your Opensky-Network PASSWORD to use the Opensky-Network. If you do not provide credentials this function will be disabled." "OPENSKY_NETWORK_PASSWORD" 8 100

  _show_whiptail_input_box "13) Optional: If you want to use additional 2D maps provide an API-TOKEN for geoapify (https://www.geoapify.com/)." "GEOAPIFY_API_KEY" 8 100

  _show_whiptail_input_box "14) Optional: If you want to use the 3D view follow these instructions:\
  \n\n* Create a free cesium account (https://cesium.com/)\
  \n* Search and add the following assets in 'Asset Depot':\
  \n  * 2275207: Google Photorealistic 3D Tiles\
  \n  * 96188: Cesium OSM Buildings\
  \n  * 3812: Earth at Night\
  \n* All three should appear in 'My Assets'\
  \n* Create an access token under 'Access Tokens'\
  \n* Copy the ACESS TOKEN and paste it below" "CESIUM_ION_DEFAULTACCESSTOKEN" 18 100

  _show_whiptail_input_box "15) Optional: If you want to fetch ships from aisstream.io (AIS messages) provide an API-KEY for aisstream.io (https://aisstream.io/)." "AISSTREAM_IO_API_KEY" 8 100

  _show_whiptail_yes_no_box "Values have been configured. The Beluga Project will now be installed.\n\nThis process takes some time. Do not close the console.\
  \n\nOn an RaspberryPi 4B:\
  \n* load database takes about 10-20 minutes (after manual update)\
  \n* first start in browser takes about 3 minutes until all aircrafts are visible\
  \n\nIf you run into any issues check out our troubleshooting page (https://github.com/amnesica/BelugaProject/blob/master/doc/TROUBLESHOOTING.md) or open up an issue on Github" 14 100
}

_run_lib_install_script() {
  pushd $REPO_NAME >/dev/null || exit
  ./run.sh install auto
  popd >/dev/null || exit
}

_copy_existing_env_file_with_progress() {
  local title="Please wait while set values are being copied to updated Beluga Project"
  {
    sleep 0.5
    echo -e "XXX\n0\nCopying values to new directory... \nXXX"
    sudo cp $ENV_FILENAME $REPO_NAME/$ENV_FILENAME >/dev/null 2>&1 || exit
    sleep 0.1
    echo -e "XXX\n100\nCopying values to new directory... Done.\nXXX"
    sleep 0.5
  } | whiptail --title "$WHIPTAIL_TITLE" --gauge "$title" 8 100 0
}

_install() {
  # prerequisite
  _check_for_docker

  _download_repo_with_progress

  _prepare_repo_with_progress

  # copy existing .env file when process is update
  if [[ ! $# -eq 0 ]]; then
    _copy_existing_env_file_with_progress
  fi

  _set_env_values

  _run_lib_install_script
}

_install_entry() {
  _show_whiptail_yes_no_box "Welcome to the installation of the Beluga Project.\n\nThe installation consists of:\
  \n* Installing docker/docker compose (if necessary)\
  \n* Downloading the repository of the Beluga Project\
  \n* Preparing the repository\
  \n* Setting values needed for running the Project (mandatory and optional steps)\
  \n* Installing the Beluga Project (running the docker containers with the set values)\
  \n\nWould you like to continue?" 16 100

  _install

  _show_whiptail_msg_box "Installation done. Open a browser and go to your <productive-systems-ip-address>:8090 you provided earlier in the steps.\
  \n\nOn first run after installation it may take up to about 3 minutes until all aircrafts are visible. If you just want to test the project, enable the OpenSky-Network functionality in the settings menu or enable Airplanes.live functionality instead." 13 100
}

_backup_env_file_progress() {
  sleep 0.5
  echo -e "XXX\n0\Backing up env file... \nXXX"
  pushd $REPO_NAME >/dev/null || exit
  sudo cp $ENV_FILENAME ../$ENV_FILENAME
  popd >/dev/null || exit
  sleep 0.1
  echo -e "XXX\n33\Backing up env file... Done.\nXXX"
  sleep 0.5
}

_stop_and_remove_containers_images_with_progress() {
  sleep 0.5
  echo -e "XXX\n33\Stopping and removing all Beluga Project containers and images... \nXXX"
  pushd $REPO_NAME >/dev/null || exit
  sudo ./run.sh docker-rm update
  popd >/dev/null || exit
  sleep 0.1
  echo -e "XXX\n66\nStopping and removing all Beluga Project containers and images... Done.\nXXX"
  sleep 0.5
}

_remove_existing_project_directory_with_progress() {
  sleep 0.5
  echo -e "XXX\n66\Removing existing Beluga Project directory... \nXXX"
  sudo rm -r $REPO_ZIP_FILENAME $REPO_NAME || exit
  sleep 0.1
  echo -e "XXX\n100\nRemoving existing Beluga Project directory... Done.\nXXX"
  sleep 1
}

_backup_and_remove_old_version() {
  local title="Please wait while backup is created and old version is removed"
  {
    _backup_env_file_progress

    _stop_and_remove_containers_images_with_progress

    _remove_existing_project_directory_with_progress

  } | whiptail --title "$WHIPTAIL_TITLE" --gauge "$title" 8 100 0
}

_update() {
  _backup_and_remove_old_version

  _install update
}

_update_entry() {
  _show_whiptail_yes_no_box "Let's update the Beluga Project.\n\nThe update process consists of:\
  \n* Backing up your set values for running the project\
  \n* Stopping and removing all docker containers of the project\
  \n* Removing the existing project directory\
  \n* Downloading the newer version of the repository\
  \n* Preparing the repository\
  \n* Copy your set values to the new repository\
  \n* Setting values needed for running the Project based on your set values (mandatory and optional steps)\
  \n* Installing the Beluga Project (running the docker containers with the set values)\
  \n\nWould you like to continue?" 20 100

  _update

  _show_whiptail_msg_box "Update done. Open a browser and go to your <productive-systems-ip-address>:8090.\
  \n\nOn first run after installation it may take up to about 3 minutes until all aircrafts are visible." 13 100
}

_entry() {
  _show_whiptail_yes_no_box "Welcome to the installation/update process for the Beluga Project.\
  \n\nWould you like to continue?" 12 100

  _show_whiptail_menu_box_entry "Would you like to install or update the Beluga Project?" 10 100 2 "Install" "Install the Beluga Project." "Update" "Update existing Beluga Project."
}

_entry
