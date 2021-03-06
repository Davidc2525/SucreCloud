
import download from "downloadjs"
import dateformat from "dateformat"
import filesize from "filesize"
import uniqid from "uniqid"
import _ from "lodash"
import {DownloadManagerInstance as dlm} from "./index.js"
import ApiInstance from "../API/v1/Api.js"
import {Map,List} from "immutable";

class DownloadShare {

	/**genera el payload de los elementos a descargar (descarga multiple), generando una sola salida*/
	generatePayloadByListItems(listItems){
		var size = listItems.map(x=>x.get("size")).reduce((a,b)=>a+b,0); // tamaño total de la seleccion
		var count = listItems.count(); // cantidad de objetos seleccionados
		var time = dateformat(new Date(),"'F'yyyymmdd'T'HHMMss");
		var dataName = `C${count}Z${size}${time}`; //parser /(?:^C(\d+))(?:Z(\d+))(?:F(\d{1,4})(\d{1,2})(\d{1,2}))(?:T(\d{1,2})(\d{1,2})(\d{1,2}))/ig
		var name = "";
		if(count>1){
			name = `Descarga de (${count}) elementos-${dataName}.zip`;
		}else{
			name = `Descarga de un elemento-${dataName}.zip`;
		}
		return new Map({size,name});
	}
	_toName(path) {
        return path.substring(path.lastIndexOf("/"));
    }
	constructor(element/*Map(item), List([item,item])*/) {//item == payload property
		var path = "/";
		var spath = "/";
		var subpath = "";
		var owner = "";
		var multiple = false;
		var pathList = null;
		var payload = null;

		/**Item con la info dela rruta q se quieres descargar*/
		if(Map.isMap(element)){
			path = this._toName(element.get("path"))
			spath = element.get("spath")
			subpath = element.get("subpath")
			owner = element.get("owner")
			payload = element;

		/**Si la descarga es de rrutas multiples de
			genera el payload reduciendo los datos contenidos
			en la lista de items seleccionados en element*/
		}else if(List.isList(element)){
			pathList = element.map(x=>x.get("path")).toJS();
			multiple = true;
			/**reducir y generar datos*/
			payload = this.generatePayloadByListItems(element);

		}else if(typeof element == "string") {
			throw new Error("Elemento de descarga no puede ser de tipo string.")
		}else if(element == null){
			throw new Error("Elemento de descarga no puede ser de null.")
		}

		this.id = uniqid();
		this.speed = 0
		this.intervalSpeedDl = setInterval(this.calcSpeed.bind(this),1000)
		this.currentDls = [];
		this.multiple = multiple;
		this.error = false;
		this.path = path;
		this.spath = spath;
		this.subpath = subpath;
		this.owner = owner;
		this.progress = 0;
		this.payload = {
			...payload.toJS(),
			loaded: 0
		}



		this.op = ApiInstance.instance.callOperation("fs::download", {
			spath: this.spath,
			subpath:this.subpath,
			owner:this.owner,
			paths:null,
			preStart: payload => {
				/*this.payload = { ...this.payload,
					...payload.data
				}*/
			},
			onProgress: this.debounceProgress,
			onError: (event,payload)=>{
				this.onErrorDownload(event,payload)
			},
			onLoad: (event, x) => {
				//console.error("onload download", this, event, x)
				if (event.status == 200) {
					var blob = event.response;

					this.onEndDonwload(event, payload);

					/**descarga es multiple*/
					if (multiple) {

						blob = new Blob([blob], {type:"application/zip"});
						download(blob, payload.get("name"), "application/zip");

					} else { /**descarga de archivo o carpeta*/
						if (payload.get("file")) {

							blob = new Blob([blob],{type:payload.get("mime", "application/optec-stream")});
							download(blob, payload.get("name"), payload.get("mime"));

						} else {

							blob = new Blob([blob], {type:"application/zip"});
							download(blob, "" + payload.get("name") + ".zip", "application/zip");

						}
					}
				}
			}
		});
	}

	calcSpeed(){
	    this.speed = ((this.currentDls.slice(this.currentDls.length-5,this.currentDls.length).reduce((a,c)=>a+c,0)));
	    this.currentDls.splice(0,this.currentDls.length-6);
	}


	debounceProgress = _.debounce((event, data) => {
		this.onprogress(event, data)
	}, 200, {
		'maxWait': 200
	})

	toObject() {
		return JSON.parse(JSON.stringify(this))
	}
	/**eliminar*/
	bind(payload) {
		this.payload = payload.data
	}

	onEndDonwload(event, data) {
		this.clear()
		console.warn("onEndDonwload",this,event, this.payload)
		dlm.instance.endDownload(this, event)
	}

	onErrorDownload(event, data) {
		this.clear()
		//console.error(event)
		this.error = true;
		dlm.instance.onError(this, event)
	}


	onprogress(event) {
		var data = this.payload;
		this.currentDl = Math.abs(event.loaded-this.payload.loaded);
		this.currentDls.push(this.currentDl);
		this.payload.loaded = event.loaded
		this.progress = (event.loaded / data.size) * 100

		dlm.instance.onProgress(this, event)
	}

	cancelDownload(){
		this.clear()
		console.warn("cancelando descarga "+this.id,this.payload.name);
		this.op.cancelDownload();
	}

	clear(){
		clearInterval(this.intervalSpeedDl);
		this.currentDls = [];
		//this.payload = null;
	}


}

export {DownloadShare}
