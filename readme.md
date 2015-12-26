## This program checks your gmail for messagess of a particular type and turns on your smartthings connected device. After x number of minutes the device is turned off.

### Step 1:

Install nodejs https://nodejs.org/

!!! Note
    All json files from the steps below are placed in the smartthings/config directory

### Step 2:
** Follow Step 1 and 2 from ** https://developers.google.com/gmail/api/quickstart/nodejs
  This is to allow access from this project to your gmail accout

### Step 3:
** Follow the following to a gain access to your smart devices ** 
   https://github.com/dpjanes/iotdb-smartthings#log-into-smartthings

### Step 4:
**Clone this project into a local directory**

```
git clone https://github.com/MichaelATang/SmartthingsDlink.git

```

### Step 5:
**Run the npm install command to install the necessary node modules**

```
npm install

```

### Step 6:
**Edit the smartthings/settings.json as required**

### Step 7:
**Test using the following**

```

node dlinksmartthings.js

```

### Step 8:
**Make a cron job to execute script as desired**

