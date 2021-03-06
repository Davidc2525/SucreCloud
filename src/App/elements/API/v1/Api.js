import ListOperation from "./operations/ListOperation.js"
import GetStatusOperation from "./operations/GetStatusOperation.js"
import RenameOperation from "./operations/RenameOperation.js"
import MkDirOperation from "./operations/MkDirOperation.js"
import DeleteOperation from "./operations/DeleteOperation.js"
import DownloadOperation from "./operations/DownloadOperation.js"
//import {Auth} from "../../auth/index.js";
import {setUserData} from "../../auth/actions.js";
import {move,copy} from "./operations/MoveOrCopyOperation.js"
import apiShareInstance from "./share/index.js"

import { ChangePasswordByRecoverOperation } from "./user/ChangePasswordByRecoverOperation";
import { SendRecoveryEmailOperation } from "./user/SendRecoveryEmailOperation";
import { SendVerifyEmailOperation } from "./user/SendVerifyEmailOperation";
import { GetAccountStatusOperation } from "./user/GetAccountStatusOperation";
import { CreateUserOperation } from "./user/CreateUserOperation";
import { ChangePasswordOperation } from "./user/ChangePasswordOperation";
import { GetUserOperation } from "./user/GetUserOperation";
import { SearchUserOperation } from "./user/SearchUserOperation";
import { UpdateUserOperation } from "./user/UpdateUserOperation";
import { SignInOperation } from "./user/SignInOperation";
import { SignOutOperation } from "./user/SignOutPeration";

import OwnerOperations from "./share/OwnerOperations.js";
import UserOperations from "./share/UserOperations.js";
import FsList from "./share/FsList.js"
import FsStatus from "./share/FsStatus.js"
import FsDownload from "./share/FsDownload.js"
import ShareCopy from "./share/Copy.js"

import {SetAvatarOperation,DeleteAvatarOperation,SetAvatarByPath} from "./user/Avatar.js"

import {
	store
} from "../../../redux/index.js";
//import {constanst} from  "../../../../../webpack/constanst.js"
const config = appConfig;
const API_DEFAULT = "fs";
const API_DEFAULT_METHOD = "POST";
class Api {


	constructor() {

		//store.subscribe(x=>this.getUserId())

		this.hostService = config.SERVICE_URL;//"http://orchi";
		this.portService = config.SERVICE_PORT; //8080;
		this.versionService = "v1"
		this.pathService = "/api/"

		this.urlService = new URL(this.hostService);
		this.urlService.pathname = this.pathService
		this.urlService.port = this.portService

		this.operations = {}
		//this.getUserId();
		this.registerOperation("list", ListOperation)
		this.registerOperation("status", GetStatusOperation)
		this.registerOperation("rename", RenameOperation)
		this.registerOperation("mkdir", MkDirOperation)
		this.registerOperation("copy", copy(), {after: (reponse,args) => {
			setTimeout(_=>{
				this.callOperation("accountstatus",{thenCB:as=>store.dispatch(setUserData(as))})
			},1000)

		}});
		this.registerOperation("move", move())
		this.registerOperation("delete", DeleteOperation, {after: (reponse,args) => {
			setTimeout(_=>{
				this.callOperation("accountstatus",{thenCB:as=>store.dispatch(setUserData(as))})
			},1000)

		}});
		this.registerOperation("download", DownloadOperation)
		this.registerOperation("accountstatus", GetAccountStatusOperation)
		this.registerOperation("login", SignInOperation)
		this.registerOperation("logout", SignOutOperation)
		this.registerOperation("getuser", GetUserOperation)
		this.registerOperation("searchuser", SearchUserOperation)
		this.registerOperation("createuser", CreateUserOperation)
		this.registerOperation("updateuser", UpdateUserOperation)
		this.registerOperation("sendrecoveryemail", SendRecoveryEmailOperation)
		this.registerOperation("sendverifyemail", SendVerifyEmailOperation)
		this.registerOperation("changepassword", ChangePasswordOperation)
		this.registerOperation("changepasswordbyrecover", ChangePasswordByRecoverOperation)

		this.registerOperation("owner::share",OwnerOperations.share());
		this.registerOperation("owner::delete", OwnerOperations.delete());
		this.registerOperation("owner::get", OwnerOperations.get());
		this.registerOperation("owner::set_users_path", OwnerOperations.setUsersPath());
		this.registerOperation("owner::set_mode", OwnerOperations.setMode());

		this.registerOperation("user::list", UserOperations.list());
		this.registerOperation("user::delete", UserOperations.delete());
		this.registerOperation("user::copy", ShareCopy,{after: (reponse,args) => {
			setTimeout(_=>{
				this.callOperation("accountstatus",{thenCB:as=>store.dispatch(setUserData(as))})
			},1000)

		}});

		this.registerOperation("fs::ls", FsList);
		this.registerOperation("fs::status", FsStatus);
		this.registerOperation("fs::download", FsDownload);


		this.registerOperation("avatar::set", SetAvatarOperation,{after: (reponse,args) => {
			setTimeout(_=>{
				this.callOperation("accountstatus",{thenCB:as=>store.dispatch(setUserData(as))})
			},500)

		}});
		this.registerOperation("avatar::delete", DeleteAvatarOperation,{after: (reponse,args) => {
			setTimeout(_=>{
				this.callOperation("accountstatus",{thenCB:as=>store.dispatch(setUserData(as))})
			},500)

		}});this.registerOperation("avatar::set_by_path", SetAvatarByPath,{after: (reponse,args) => {
			setTimeout(_=>{
				this.callOperation("accountstatus",{thenCB:as=>store.dispatch(setUserData(as))})
			},500)

		}});

	}

	getUserId() {
		//console.warn("API",store)
		//return
		const auth = store.getState().get("auth");

		const dataUser = auth.getIn(["dataUser","user"], null);
		var displayName = "";
		if (dataUser != null) {
			this.userid = dataUser.get("id")
		}

	}

	callOperation(name, args) {

		const op = this.operations[name]
		if (op == null) {
			throw `operaion no ${name} existe`
		} else {
			op["before"](args);
			if(args.hasOwnProperty("thenCB")){
				const thenCBArg = args["thenCB"];
				const after = op["after"];
				/**Sustituimos la funciona thenCB original por una que permita
				 * ejecutar dicha funcion y la funcion "after"
				 * funciona a jecutar luego de ejecutar la operacion y devuelva la llamada a thenCB
				 */
				args["thenCB"] = _ => {
					thenCBArg(_);
					after(_,args);
				}
			}
			let opObject = new op["op"](args);
			return opObject;
		}

	}

	registerOperation(name, Operation, {before = _=>{},after = _=>{}} = {}) {
		this.operations[name] = {};
		this.operations[name]["op"] = Operation;
		this.operations[name]["before"] = before
		this.operations[name]["after"] = after
	}

     fetch({apiArg},api = API_DEFAULT, method = API_DEFAULT_METHOD, editFormDataBeforeSend = ()=>{} ){

        return new Promise((resolve,reject)=>{
                var arg:Object = { ...apiArg,uid:this.userid}
		        var fd = new FormData();

		       	arg = encodePathsInArg(arg);

		        fd.append("args", JSON.stringify(arg,null,2))
		        fd.append("op", arg.op)

		        try{
		        	editFormDataBeforeSend(fd);
		        }catch(e){
		        	console.error(e)
		        }
		        var xhr = new XMLHttpRequest();

		        if(typeof arguments[arguments.length-1] == "function"){
					//arguments[arguments.length-1](xhr);
				}

				method = method.toUpperCase();
				if(method=="POST"||method=="DELETE"||method=="PUT"){
					xhr.open(method, this.urlService+api/*+`?args=${btoa(JSON.stringify(arg))}`*/, true);
				}else if(method=="GET"){
					xhr.open(method, this.urlService+api+`?op=${arg.op}&args=${(JSON.stringify(arg))}`, true);
			   }
				//xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
                //xhr.setRequestHeader('Content-type', 'application/json');
                //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
		        xhr.withCredentials = true;
		        xhr.responseType = 'json';


		        xhr.onprogress = (event) => {

		        };

				xhr.onerror = (event) => {

					console.warn(xhr)
					reject({
						error: "connection_error",
						msg: "Error al tratar de conectar, revisa tu conexion."
					})
				}

				xhr.onload = event => {
					const auth = require("../../auth/index.js").auth
					//resolve(xhr.response)
					//return
					var response = xhr.response;
					console.warn(response)
					if (response.status === "error") {
						if (response.error == "session") {
							reject(response)
							auth.Auth.setStateNoLogin();
							return;
						}

						if(response.error == "user_unavailable"){
						    alert(response.msg)
						    reject(response)
							auth.Auth.setStateNoLogin();
							return;
						}

						reject(response)

					} else {
						resolve(response)
					}
				};

		        if(method=="POST"||method=="PUT"){
					xhr.send(fd);
				}else{
					xhr.send();
				}

        })


     }

	fetch2({
		apiArg
	}) {
		//console.warn("nuevo fetch",apiArg)
		var arg = {...apiArg}
		var fd = new FormData();

		fd.append("args", JSON.stringify(arg))

		var options = {
			method: 'POST',
			//mode: 'cors',
			headers: {
				'Accept': 'application/json',
			},
			//credentials: 'include', mode: 'no-cors',
			body: (fd)
		}
		return fetch(this.urlService+"?args="+btoa(JSON.stringify(arg)), options)
			.then(x => x.json())
			.catch(x => {console.warn(x); return Promise.reject({
				error: x
			})})

	}

	xmlHttpRequestFetch({apiArg}) {


	}
}

const encodePathsInArg  = (arg:Object):Object => {
	let args = {...arg};
	/*
    path
    paths Array
    srcPath
	dstPath
	*/

	try {
		if (args.hasOwnProperty("path")) {
			args["path"] = encodeURIComponent(decodeURIComponent(args["path"]))
		}

		if (args.hasOwnProperty("spath")) {
			args["spath"] = encodeURIComponent(decodeURIComponent(args["spath"]))
		}

		if (args.hasOwnProperty("subpath")) {
			args["subpath"] = encodeURIComponent(decodeURIComponent(args["subpath"]))
		}

		if (args.hasOwnProperty("dstpath")) {
			args["dstpath"] = encodeURIComponent(decodeURIComponent(args["dstpath"]))
		}

		if (args.hasOwnProperty("srcpath")) {
			args["srcpath"] = encodeURIComponent(decodeURIComponent(args["srcpath"]))
		}

		if (args.hasOwnProperty("srcPath")) {
			args["srcPath"] = encodeURIComponent(decodeURIComponent(args["srcPath"]))
		}
		if (args.hasOwnProperty("dstPath")) {
			args["dstPath"] = encodeURIComponent(decodeURIComponent(args["dstPath"]))
		}
		if (args.hasOwnProperty("paths") && args["paths"] instanceof Array) {
			args["paths"] = args["paths"].map(x => encodeURIComponent(decodeURIComponent(x)))
		}
	} catch (e) {
		return arg;
	}

    return args;

}

const ApiInstance = {
	instance: new Api()
}

window.api = ApiInstance.instance
export default ApiInstance;
export {encodePathsInArg}

//calls
/*try {
	ApiInstance.instance.callOperation("list", {
		path: "/music",
		thenCB: (x) => console.warn(x),
		catchCB: (x) => console.error(x)
	})
} catch (e) {
	console.error(e)
}*/
