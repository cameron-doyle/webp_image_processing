import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import PropTypes from 'prop-types'

import imageCompression from 'browser-image-compression';


function ImageProcessing(props) {
	const [path, setPath] = useState("");
	const [images, setImages] = useState();
	//const path = ""
	return (
		<div>
			<input type="file" accept="image/*" onChange={handleImageUpload} value={path} />
			<div id='compressedImage'>{images}</div>
		</div>
	)

	//Compresses images on change of the file input
	async function handleImageUpload(event) {
		//TODO figure out how to crop data (look at another img processor like jimp)
		//Update the path value for file input
		setPath(event.target.value)

		//Get img data as blob
		const imageFile = event.target.files[0];
		console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
		console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

		//Compression options for browser-image-compression
		const options = {
			maxSizeMB: .05,
			maxWidthOrHeight: 720,
			useWebWorker: true
		}

		//Compress img
		try {
			const compressedFile = await imageCompression(imageFile, options);
			console.log('compressedFile instanceof Blob', compressedFile instanceof Blob); // true
			console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`); // smaller than maxSizeMB

			//Displays compressed img
			displayImg(compressedFile);
		} catch (error) {
			console.log(error);
		}
	}

	//Displays an img inside a canvas element
	function displayImg(fileBlob) {
		let canvas = document.createElement('canvas');

		HTMLCanvasElement.prototype.renderImage = function (blob) {
			let ctx = this.getContext('2d');
			let img = new Image();
			const instance = this //Used in img.onload to reference canvas width/height properties

			//Called when img is being loaded
			img.onload = function () {
				//Set width/height of canvas to match img data
				instance.width = img.width
				instance.height = img.height

				//Draw image
				ctx.drawImage(img, 0, 0)
			}

			//Load image data to img
			img.src = URL.createObjectURL(blob);
		};

		const dimensions = canvas.renderImage(fileBlob, (dimensions) => {
			/* canvas.width = dimensions.width
			canvas.height = dimensions.height */
			document.getElementById("compressedImage").appendChild(canvas)
			console.log(dimensions)
		});
		document.getElementById("compressedImage").appendChild(canvas)
	}
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


ImageProcessing.propTypes = {}

export default ImageProcessing
