
import React,{Component} from "react"
import {connect} from "react-redux"
import {
  push
} from "react-router-redux";
//import { RadialBarChart,RadialBar,Legend,Tooltip } from 'recharts';
//import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import filesize from "filesize"
import numeral from "numeral"
import { Map } from "immutable";
import CloudQueue from '@material-ui/icons/CloudQueue';
const styles = theme => (window.tt = theme,{
  root: {
   	padding:theme.spacing.unit * 0,
    flexGrow: 1,
  },
  
  iconContent:{
  	...tt.mixins.gutters()
  	
  }
});


@withStyles(styles,{withTheme:true})
@connect((state : Map, props)=>{
	const user=state.getIn(["auth","dataUser","user"],null);
	const summary=state.getIn(["auth","dataUser","contentSummary"],null);

	if(summary==null||user==null){
		return {
			user:{emailVerified:true},
			summary: {
				"directoryCount": 0,
				"fileCount": 0,
				"length": 0,
				"spaceQuota": 0,
				"spaceConsumed": 0,
				"quota": -1
			}
		}
	}
	return {summary:summary.toJSON(),user:user.toJSON()}
})
class MiniControl extends Component{


	_toView(summary){
		return parseInt(summary.length*100/summary.spaceQuota)
	}

	render(){
		const {classes,summary,user} = this.props

		const {emailVerified} = user;

		return (

			<div className={classes.root}>
		        <Grid container style={{paddingTop:10}}>
		          <Grid item xs={3} className={classes.iconContent}>
		          	<CloudQueue color={"action"}/>
		          </Grid>
		          <Grid item xs={9} >
		             <Grid container style={{paddingRight:20}}>
		             	<Grid item xs={12} style={{ marginBottom: 5}}>
		             		<Typography variant="body2">Almacenamiento</Typography>
		             	</Grid>
		             	<Grid item xs={12} style={{ marginBottom: 5}}>
			            	<div>
			                	<LinearProgress  variant="determinate" value={this._toView(summary)}/>
			              	</div>
		             	</Grid>
		             	<Grid item xs={12}>
		             		<Typography variant="caption">{`${filesize(summary.length)} de ${filesize(summary.spaceQuota)} usado`}</Typography>
		             	</Grid>
		             </Grid>
		          </Grid>
		        </Grid>
			</div>

		)
	}
}

export default MiniControl;
