const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const port = process.env.PORT || 3000;

module.exports = {
	resolve: {
		fallback: {
			
		}
	},
	mode: 'development',
	entry: './src/index.jsx',
	output: { filename: "bundle.[hash].js" },
	devtool: 'inline-source-map',
	devServer: {
		host: 'localhost',
		port: 3000,
		historyApiFallback: true,
		open: true
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'public/index.html',
		})
	],
	module: {
		rules: [

			// First Rule
			{
				test: /\.(js|jsx|ts|tsx)$/,
				exclude: /node_modules/,
				use: ['babel-loader']
			},

			// Second Rule
			{
				test: /\.css$/,
				use: [
					{
						loader: 'style-loader'
					},
					{
						loader: 'css-loader',
						options: {
							modules: true,
							localsConvention: 'camelCase',
							sourceMap: true
						}
					}
				]
			}
		]
	}
};