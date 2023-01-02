import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import PropTypes, { arrayOf, object } from 'prop-types'

import imageCompression from 'browser-image-compression';

/* The componant function */
export default function ImageProcessing(props) {
	//Array of objects that stores image blobs as "data" and incrementing id's as "id"
	const [imageBlobs, setImageBlobs] = useState([]);

	const [path, setPath] = useState("");

	
	return (
		<div>
			<input id="testImg" type="file" accept="image/*" onChange={handleImageUpload} value={path}/>
			<div id='compressedImage'>{imageBlobs.map(image => <img src={URL.createObjectURL(image.data)} key={image.id}/>)}</div>
		</div>
	)

	//Compresses images on change of the file input
	async function handleImageUpload(event) {
		//TODO figure out how to crop data (look at another img processor like jimp)
		//Update the path value for file input
		setPath(event.target.value)


		//Get img data as blob
		let imageFile = event.target.files[0]
		
		imageFile = await cropImg(imageFile)

		//Compress img
		const compressedFile = await compressImg(imageFile)

		//Save data
		setImageBlobs(imageBlobs  => [...imageBlobs, {id:generateID(imageBlobs),data:compressedFile}])

		//Display results
		console.log(`size: original = ${Math.floor(imageFile.size / 1024, 2)} kb, compressed = ${Math.floor(compressedFile.size / 1024, 2)} kb. ${reducPercent(imageFile.size, compressedFile.size)}%`)
	}
}


//Compresses an img and returns the compressed img as a blob
async function compressImg(imgBlob){
	//Compression options for browser-image-compression
	const options = {
		maxSizeMB: .05,
		maxWidthOrHeight: 720,
		useWebWorker: true
	}

	//Compress img
	try {
		//TODO change to webp codec https://github.com/GoogleChromeLabs/squoosh/tree/dev/codecs/webp
		return await imageCompression(imgBlob, options)
	} catch (err) {
		console.error(err)
	}
}
/** Apply aspect ratio https://en.wikipedia.org/wiki/Aspect_ratio_%28image%29 */
async function applyAspectRatio(){

}

/** Crops an image according the provided optionsObj {top, right, bottom, left} */
async function cropImg(imgBlob, cropOptions){
	cropOptions = {left:200, bottom: 100}

	const can = document.createElement('canvas')
	

	return imgBlob
}

//reduction representated by a persent, example: (100, 76) = 25%
function reducPercent(num1, num2){
	//Calc diff (largest input - smallest input)
	let diff = (num1 > num2) ? num1 - num2:num2 - num1

	//Calc percentage decrease (diff / largest input * 100)
	return Math.floor((diff / (num1 > num2 ? num1:num2)) * 100)
}

//Returns a new ID based on the last element's id of a sorted array of objects (requires an object key of "id")
function generateID(array){
	//Sort array by id
	array.sort((obj1, obj2) => {
		if(obj1.id < obj2.id) return -1
		if(obj1.id > obj2.id) return 1
		return 0
	})

	//Get last element of sorted array
	let lastEle = array[array.length - 1]

	//Return either the lastID + 1, or 1 in case of no elements (first element assumed)
	return (lastEle !== undefined && lastEle.id > 0) ? lastEle.id + 1:1
}

/* function whatOS() {

	//List of Operating Systems
	const os = [
		{ name: "Android", value: "Android" },
		{ name: "iPhone", value: "iPhone" },
		{ name: "iPad", value: "Mac" },
		{ name: "Macintosh", value: "Mac" },
		{ name: "Linux", value: "Linux" },
		{ name: "Windows", value: "Win" },
	]
	//Useragent contains browser details and OS  details but we need to separate them
	let userDetails = navigator.userAgent;
	for (let i in os) {
		//check if string contains any value from the object
		if (userDetails.includes(os[i].value)) {
			//displau name of OS from the object
			return os[i].name;
		}
	}
} */

ImageProcessing.propTypes = {
	data:arrayOf(Blob)
}

