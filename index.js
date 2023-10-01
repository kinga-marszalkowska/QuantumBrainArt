import { Neurosity } from "@neurosity/sdk";
import {} from 'dotenv/config'
import axios from 'axios';
// const { Neurosity } = require("@neurosity/sdk");
// require("dotenv").config();

const deviceId = process.env.DEVICE_ID || "";
const email = process.env.EMAIL || "";
const password = process.env.PASSWORD || "";

let hue;

const verifyEnvs = (email, password, deviceId) => {
    const invalidEnv = (env) => {
      return env ===  "" || env === 0;
    };
    if (invalidEnv(email) || invalidEnv(password) || invalidEnv(deviceId)) {
      console.error(
        "Please verify deviceId, email and password are in .env file, quitting..."
      );
      process.exit(0);
    }
  };
  verifyEnvs(email, password, deviceId);
  
  console.log(`${email} attempting to authenticate to ${deviceId}`);

  const neurosity = new Neurosity({
    deviceId
  });

  const main = async () => {
    await neurosity
      .login({
        email,
        password
      })
      .catch((error) => {
        console.log(error);
        throw new Error(error);
      });
    console.log("Logged in");
  };
  
  main();

 
  const powerByBandSubscription = neurosity.brainwaves("powerByBand").subscribe((brainwaves) => {
    arr=brainwaves.data.alpha;
    average = (arr[1] + arr[2]  + arr[6])/3;
    // console.log(arr);
    // console.log(average);
    // console.log("===============");
    
  });

  // powerByBandSubscription.unsubscribe();

  let minYchange = 0;
  let maxYchange = 50;
  let layers = 7;
  let rotStripe = 0;
  let lines = false;
  let alph = 255;
  let sw = 3;
  let extraBlackAlph = 255;
  let h, s, v;
  let end;

  let saturations = [];
  let values = [];


  function setup() {
    canv = createCanvas(600, 600);
    if (lines == true) {
      stroke(0, 0, 0, extraBlackAlph);
      strokeWeight(sw);
    } else {
      noStroke();
    }
    colorMode(HSL);
  
    angleMode(DEGREES);
    end = height / 2 + 500;
    
    generateImage(); // Generate the initial image
    
    // Generate a new image every second
  }


  function generateImageOnClick() {    
    console.log("=================================");

    const calmSubscription = neurosity.calm().subscribe((calm) => {
      hue = Math.pow(1/calm.probability, 2);
      console.log(calm.probability);
      maxYchange = 100 * calm.probability+0.1;
      rotStripe += calm.probability+0.1;
    });
    // calmSubscription.unsubscribe();

    getValuesSaturations();

    generateImage();
  }
  var button = document.getElementById("generateButton");
  button.onclick = generateImageOnClick;
  
  
  function getValuesSaturations() {
    const url = 'http://127.0.0.1:8000/color';
    if (hue >= 1000) {hue = 1000;}
    console.log("hue: " + Math.floor(hue));
    const queryParams = {
      hue: Math.floor(hue),
      count: 128
    };

    // Send a GET request with Axios
    axios.get(url, { params: queryParams })
      .then(response => {
        // Handle the response data
        // console.log(response.data);
        saturations = response.data.saturation;
        values = response.data.luminance;
      })
      .catch(error => {
        // Handle errors
        console.error('There was an error:', error);
    });
  }

  
  function generateImage() {
    clear();

    for (let i = 0; i < layers; i++) {
      let y1;
      if (i == 0) {
        y1 = -height / 2 - 300;
      } else {
        y1 = -height / 2 + (height / layers) * i;
      }
      let y2 = y1,
        y3 = y1,
        y4 = y1,
        y5 = y1,
        y6 = y1;
      let rotLayer = random(359);
      let rotThisStripe = 0;
      
      while (
        (y1 < end) &
        (y2 < end) &
        (y3 < end) &
        (y4 < end) &
        (y5 < end) &
        (y6 < end) &
        (-maxYchange < minYchange)
      ) {
        y1 += random(minYchange, maxYchange);
        y2 += random(minYchange, maxYchange);
        y3 += random(minYchange, maxYchange);
        y4 += random(minYchange, maxYchange);
        y5 += random(minYchange, maxYchange);
        y6 += random(minYchange, maxYchange);
  
        // console.log(h,s,v);
        generateColor();
  
        fill(h, s, v, alph);
        
        push();
        translate(width / 2, height / 2);
        rotThisStripe += rotStripe;
        rotate(rotThisStripe + rotLayer);
        let xStart = -width / 2;
        beginShape();
        curveVertex(xStart - 300, height / 2 + 500);
        curveVertex(xStart - 300, y1);
        curveVertex(xStart + (width / 5) * 1, y2);
        curveVertex(xStart + (width / 5) * 2, y3);
        curveVertex(xStart + (width / 5) * 3, y4);
        curveVertex(xStart + (width / 5) * 4, y5);
        curveVertex(width / 2 + 300, y6);
        curveVertex(width / 2 + 300, height / 2 + 500);
        endShape(CLOSE);
        pop();
      }
    }
  }

  
function generateColor() {
  h = mapValue(hue* random(0.93, 1.07), 0, 1000, 0, 256);    
  console.log("h: " + Math.floor(h));

  // var url = new URL("'http://127.0.0.1:8000/color?");
  // url.searchParams.append('hue', h);

  
  s = saturations[Math.floor(Math.random()*saturations.length)];
  v = values[Math.floor(Math.random()*values.length)];
}


function mapValue(value, fromMin, fromMax, toMin, toMax) {
  // Ensure that the input value is within the fromMin and fromMax range
  value = Math.min(Math.max(value, fromMin), fromMax);
  
  // Calculate the mapped value in the toMin and toMax range
  const mappedValue = ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;

  return mappedValue;
}
  
// setInterval(generateImage, 1000);

global.setup = setup;