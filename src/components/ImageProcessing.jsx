import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import PropTypes, { arrayOf, object } from 'prop-types'

import webp_enc from '../webp/webp_enc'

/* The componant function */
export default function ImageProcessing(props) {
	//Array of objects that stores image blobs as "data" and incrementing id's as "id"
	const [imageBlob, setImageBlob] = useState();
	const [path, setPath] = useState("");


	return (
		<div>
			<input id="testImg" type="file" accept="image/*" onChange={handleImageUpload} value={path} />

			{(imageBlob != undefined) ? <img id='compressedImage' src={URL.createObjectURL(imageBlob)} /> : <img id='compressedImage' src="./83f.png" />}
		</div>
	)

	//Compresses images on change of the file input
	async function handleImageUpload(event) {
		//TODO for the sake of usability, make all methods take a file from filelist, and convert it to blob if not blob https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#getting_information_on_selected_files

		//Update the path value for file input
		setPath(event.target.value)

		const quality = 75
		const px = 720
		const dimention = "height"
		const ratio = 4/3

		//Get img blob from file
		const imgFile = event.target.files[0];
		let imgBlob = await getBlob(event.target.files[0])
		//let imgBlob = imgFile
		const ogDimensions = await getDimensions(imgBlob)

		//Crop imgBlob
		//imgBlob = await crop(imgBlob, {top:350, right:0, bottom:200, left:0})

		//Scale imgBlob
		//imgBlob = await scale(imgBlob, 1920, "width")

		//Apply aspect ratio and scale to desired resolution
		imgBlob = await applyRatio(imgBlob, ratio, { px, dimention })

		//Compress img
		const compressedFile = await webpCompress(imgBlob, quality)

		//Get new dimensions
		const dimensions = await getDimensions(compressedFile)

		//Save data
		setImageBlob(compressedFile)

		//Display results
		console.log(`size: original = ${Math.floor(imgFile.size / 1024, 2)} kb, compressed = ${Math.floor(compressedFile.size / 1024, 2)} kb. ${reducPercent(imgFile.size, compressedFile.size)}% @${quality}% quality`)
		console.log(`dimensions: before ${ogDimensions.width}x${ogDimensions.height}, after: ${dimensions.width}x${dimensions.height}`)
	}
}

/**
 * Takes a file object and returns a blob
 * @param {object} imgFile https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#getting_information_on_selected_files
 * @returns {Promise<Blob>} Image Blob
 */
async function getBlob(imgFile) {
	return new Promise((resolve) => {
		const fr = new FileReader()
		fr.readAsArrayBuffer(imgFile)
		fr.onload = () => resolve(new Blob([fr.result], { type: imgFile.type }))
	})
}

/**
 * Takes a Blob and returns an instance of ImageData (used by compression method)
 * @param {Blob} imgBlob 
 * @returns {Promise<ImageData>} ImageData
 */
async function getImageData(imgBlob) {
	return new Promise(async (resolve) => {
		const canvas = document.createElement('canvas')

		//Get img w/h
		const dimensions = await getDimensions(imgBlob)

		canvas.width = dimensions.width
		canvas.height = dimensions.height

		const img = new Image()

		//When loading is complete, return the ImageData
		img.onload = () => {
			const ctx = canvas.getContext('2d')
			ctx.drawImage(img, 0, 0)

			//Get ImageData
			resolve(ctx.getImageData(0, 0, dimensions.width, dimensions.height))
		}

		//Load img blob
		img.src = URL.createObjectURL(imgBlob)
	})
}

/**
 * Compresses an image Blob
 * @param {Blob} imgBlob 
 * @param {Number} quality between 0 and 100
 * @returns {Promise<Blob>} compressed image blob
 */
async function webpCompress(imgBlob, quality) {
	/* 
		The webp codec files came from: https://github.com/cameron-doyle/squoosh/tree/dev/codecs/webp/enc
		The example used to understand the codec: https://github.com/cameron-doyle/squoosh/blob/dev/codecs/webp/enc/example.html
	*/
	return new Promise(async resolve => {
		webp_enc().then(async module => {
			const image = await getImageData(imgBlob);
			resolve(new Blob([module.encode(image.data, image.width, image.height, {
				quality,
				target_size: 0,
				target_PSNR: 0,
				method: 4,
				sns_strength: 50,
				filter_strength: 60,
				filter_sharpness: 0,
				filter_type: 1,
				partitions: 0,
				segments: 4,
				pass: 1,
				show_compressed: 0,
				preprocessing: 0,
				autofilter: 0,
				partition_limit: 0,
				alpha_compression: 1,
				alpha_filtering: 1,
				alpha_quality: 100,
				lossless: 0,
				exact: 0,
				image_hint: 0,
				emulate_jpeg_size: 0,
				thread_level: 0,
				low_memory: 0,
				near_lossless: 100,
				use_delta_palette: 0,
				use_sharp_yuv: 0,
			})], { type: 'image/webp' }));
		})
	})
}

/**
 * Applies an aspect ratio: https://en.wikipedia.org/wiki/Aspect_ratio_%28image%29#Still_photography
 * NOTE: if you use scaling, apply the scaling before applying the ratio, it leads to more consistant ratios.
 * @param {Blob} imgBlob 
 * @param {Float} ratio Decimal ratio, pass in a division like 4/3 or 16/9, see wikipedia page for standard ratios
 * @param {object} targetResolution object that determines the desired width or height in pixels, format: {px:number, dimention:string = "width" or "height"}
 * @returns {Promise<Blob>} cropped img blob
 */
async function applyRatio(imgBlob, ratio, targetResolution = null) {
	//InverseRatio is used on width, ratio is used on height
	const inverseRatio = 1 / ratio

	//If scaleOptions isn't undefined, and both px & dimention isn't undefined, and px is a positive number, and dimentions is either "width" or "height"
	if (targetResolution !== undefined && (targetResolution.px !== undefined && targetResolution.px > 0) && (targetResolution.dimention !== undefined && (targetResolution.dimention === "width" || targetResolution.dimention === "height"))) {
		//The target w/h after scaling and ratio applied
		let optimalWidth, optimalHeight

		//Calculate optimal (desired final) w/h based on which was provided
		if (targetResolution.dimention === "height") {
			optimalWidth = parseFloat(ratio * targetResolution.px).toFixed(0)
			optimalHeight = Number(targetResolution.px);
		} else {
			optimalHeight = parseFloat(inverseRatio * targetResolution.px).toFixed(0)
			optimalWidth = Number(targetResolution.px);
		}

		//calculate the diff between the optimal dimentions and actual dimentions (make positive if negative)
		let actualDi = await getDimensions(imgBlob)

		let wDiff = actualDi.width - optimalWidth
		wDiff = (wDiff < 0) ? wDiff * 1 : wDiff

		let hDiff = actualDi.height - optimalHeight
		hDiff = (hDiff < 0) ? hDiff * 1 : hDiff

		//Scale based on whichever dimention will fit
		if (wDiff <= hDiff)
			imgBlob = await scale(imgBlob, optimalWidth, "width")
		else
			imgBlob = await scale(imgBlob, optimalHeight, "height")
	}

	//Get image dimensions
	let dimensions = await getDimensions(imgBlob)

	//Get desired (optimal) dimensions to be used for cropping
	let desiredWidth = parseFloat(ratio * dimensions.height).toFixed(0)
	let desiredHeight = parseFloat(inverseRatio * dimensions.width).toFixed(0)

	//Determine which dimention to crop, for the desired ratio
	if (dimensions.height > desiredHeight) { //Crop excess from height
		//Calc how many pixels need to be removed in total
		const toRemove = dimensions.height - desiredHeight

		/*
		 Because we are dividing by 2, uneven numbers will give us a x.5 value.
		 To ensure the accurate amount of total pixels is being removed,
		 we favor the one side by increasing it by .1 and removing .1 from the other,
		 this ensures that the total pixels removed is always correct.
		*/
		const fromTop = Number(parseFloat((toRemove / 2) + .1).toFixed(0))
		const fromBot = Number(parseFloat((toRemove / 2) - .1).toFixed(0))
		return crop(imgBlob, { top: fromTop, bottom: fromBot })
	} else if (dimensions.width > desiredWidth) { //Crop excess from width
		//Calc how many pixels need to be removed in total
		const toRemove = dimensions.width - desiredWidth

		/*
		 Because we are dividing by 2, uneven numbers will give us a x.5 value.
		 To ensure the accurate amount of total pixels is being removed,
		 we favor the one side by increasing it by .1 and removing .1 from the other,
		 this ensures that the total pixels removed is always correct.
		*/
		const fromLeft = Number(parseFloat((toRemove / 2) + .1).toFixed(0))
		const fromRight = Number(parseFloat((toRemove / 2) - .1).toFixed(0))
		return crop(imgBlob, { left: fromLeft, right: fromRight })
	}

	//Already at desired aspect ratio
	return imgBlob
}

/**
 * Scales an images width/height up/down to a specified size in pixels
 * @param {Blob|File} imgBlob 
 * @param {Number} px desired size in pixels
 * @param {string} on either "width" || "height"
 * @returns {Promise<Blob>} scaled image Blob
 */
async function scale(imgBlob, px, on) {
	return new Promise(async (resolve) => {
		const canvas = document.createElement('canvas')

		if (px <= 0) px = 1

		//Get img w/h
		const dimensions = await getDimensions(imgBlob)

		let scale
		if (on.toLowerCase() === "width") {
			scale = (dimensions.width - px) / dimensions.width
		} else if (on.toLowerCase() === "height") {
			scale = (dimensions.height - px) / dimensions.height
		} else {
			throw new Error(`Scale requires the on argument to be either 'width' or 'height'. on = ${on}`)
		}

		canvas.width = dimensions.width - (dimensions.width * scale)
		canvas.height = dimensions.height - (dimensions.height * scale)

		const img = new Image()

		//When loading is complete, return the cropped img
		img.onload = () => {
			canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

			//Get cropped blob from canvas and resolve promise
			canvas.toBlob(blob => resolve(blob))
		}

		//Load img blob
		img.src = URL.createObjectURL(imgBlob)
	})
}

/**
 * Crops an image according the provided cropOptions object
 * @param {Blob} imgBlob image data in blob format
 * @param {object} cropOptions {top?:number, right?:number, bottom?:number, left?:number}
 * @returns {Promise<Blob>} cropped image Blob
 */
async function crop(imgBlob, cropOptions) {
	return new Promise(async (resolve) => {
		//check null and assign default values to avoid NaN calculations
		if (cropOptions == undefined)
			throw new Error("cropImg requires a cropOption obj in the following format: {top?:number, right?:number, bottom?:number, left?:number}")
		cropOptions.top ??= 0
		cropOptions.right ??= 0
		cropOptions.bottom ??= 0
		cropOptions.left ??= 0

		const canvas = document.createElement('canvas')

		//Get img w/h
		const dimensions = await getDimensions(imgBlob)

		//Set canvas size to original w/h - the desired crop for each axis
		canvas.width = dimensions.width - (cropOptions.left + cropOptions.right)
		canvas.height = dimensions.height - (cropOptions.top + cropOptions.bottom)

		const img = new Image()

		//When loading is complete, return the cropped img
		img.onload = () => {
			canvas.getContext('2d').drawImage(img, -cropOptions.left, -cropOptions.top)

			//Get cropped blob from canvas and resolve promise
			canvas.toBlob(async blob => resolve(blob))
		}

		//Load img blob
		img.src = URL.createObjectURL(imgBlob)
	})
}

/**
 * Returns the width and height of an img
 * @param {Blob} imgBlob imageBlob
 * @returns {Promise<object>} {width: number, height: number}
 */
async function getDimensions(imgBlob) {
	return new Promise((resolve) => {
		const img = new Image()

		//On load, return the width/height
		img.onload = () => resolve({ width: img.width, height: img.height })

		//Load img
		img.src = URL.createObjectURL(imgBlob)
	})
}

/**
 * A reduction value representated in persentage, 
 * @param {Number} start Either the smalled or largest
 * @param {Number} end 
 * @returns {Number} examples: 
 * (50, 100) = -100%, (100, 75) = 25%, (50, 50) = 0%
 */
function reducPercent(start, end) {
	return Math.floor(((start - end) / start) * 100)
}

/**
 * Returns a new ID based on the last element's id of a sorted array of objects (requires an object key of "id")
 * @param {Array<object>} array (objects bust contain a numerical "id" key)
 * @returns {Number} newID based on largest ID in the array
 */
function generateID(array) {
	//Sort array by id
	array.sort((obj1, obj2) => {
		if (obj1.id < obj2.id) return -1
		if (obj1.id > obj2.id) return 1
		return 0
	})

	//Get last element of sorted array
	let lastEle = array[array.length - 1]

	//Return either the lastID + 1, or 1 in case of no elements (first element assumed)
	return (lastEle !== undefined && lastEle.id > 0) ? lastEle.id + 1 : 1
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
	data: arrayOf(Blob)
}

