/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {Component} from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Dimensions,
  PanResponder,
  CameraRoll,
  AlertIOS,
  ActivityIndicatorIOS
} from 'react-native';

import Swiper from 'react-native-swiper';
import NetworkImage from 'react-native-image-progress';
import Progress from 'react-native-progress';
import RandManager from './RandManager.js';
import ProgressHUD from './ProgressHUD.js';
import ShakeEvent from 'react-native-shake-event-ios';

var {width, height} = Dimensions.get('window');
const NUM_WP = 10;
const DOUBLE_TAP_DELAY = 400;
const DOUBLE_TAP_RADIUS = 20;

class SplashWalls extends Component {

  constructor(props) {
    super(props);

    this.state = {
      wallsJSON: [],
      isLoading: true,
      isHUDVisible: false
    };
    this.imagePanResponder = {};
    this.prevTouchInfo = {
      prevTouchX: 0,
      prevTouchY: 0,
      prevTouchTimeStamp:0
    };
    this.currentWallpaperIndex = 0;
    this.handlePanResponderGrant = this.handlePanResponderGrant.bind(this);
    this.onMomentumScrollEnd = this.onMomentumScrollEnd.bind(this);
  }

  componentDidMount() {
    this.fetchWallsJSON();
  }

  handleStartShouldSetPanResponder(e, gestureState){
    return true;
  }

  handlePanResponderGrant(e, gestureState){
    var currentTouchTimeStamp = Date.now();

    if(this.isDoubleTap(currentTouchTimeStamp, gestureState))
      this.saveCurrentWallpaperToCameraRoll();

    this.prevTouchInfo = {
      prevTouchX: gestureState.x0,
      prevTouchY: gestureState.y0,
      prevTouchTimeStamp: currentTouchTimeStamp
    };
  }

  distance(x0, y0, x1, y1) {
    return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
  }

  isDoubleTap(currentTouchTimeStamp, {x0, y0}) {
    var {prevTouchX, prevTouchY, prevTouchTimeStamp} = this.prevTouchInfo;
    var dt = currentTouchTimeStamp - prevTouchTimeStamp;

    return (dt < DOUBLE_TAP_DELAY && this.distance(prevTouchX, prevTouchY, x0, y0) < DOUBLE_TAP_RADIUS);
  }

  handlePanResponderEnd(e, gestureState){
    console.log("Not touched anymore")
  }

  componentWillMount(){
    this.imagePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: this.handlePanResponderEnd
    });

    ShakeEvent.addEventListener('shake', () => {
      console.log("Shaken not stirred");
      this.initialize();
      this.fetchWallsJSON();
    });
  }

  initialize(){
    this.setState({
      wallsJSON: [],
      isLoading: true,
      isHUDVisible: false
    });

    this.currentWallpaperIndex = 0;
  }

  
  fetchWallsJSON() {
    var url = 'http://unsplash.it/list';
    fetch(url)
      .then(response => response.json())
      .then(jsonData => {
        var randomIds = RandManager.uniqueRandomNumbers(NUM_WP, 0, jsonData.length);
        var walls = [];
        randomIds.forEach(randomId => {
          walls.push(jsonData[randomId]);
        });
        this.setState({
          isLoading: false,
          wallsJSON: [].concat(walls)
        });
      })
      .catch(error => console.log("Fetch error " + error));
  }

  onMomentumScrollEnd(e, state, context){
    this.currentWallpaperIndex = state.index;
  }

  saveCurrentWallpaperToCameraRoll(){
    this.setState({isHUDVisible: true});

    var {wallsJSON} = this.state;
    var currentWall = wallsJSON[this.currentWallpaperIndex];
    var currentWallURL = `http://unsplash.it/${currentWall.width}/${currentWall.height}?image=${currentWall.id}`;

    CameraRoll.saveImageWithTag(currentWallURL, (data) => {
      this.setState({isHUDVisible: false});
      AlertIOS.alert(
        'saved',
        'Wallpaper saved to camera roll.',
        [
          {text:"Success !", onPress: () => console.log("Button pressed")}
        ]
      );
    },
    (err) => {
      console.log("Error saving to camera roll");
    });
  }


  render() {
    var {isLoading} = this.state;
    if(isLoading)
      return this.renderLoadingMessage();
    else 
      return this.renderResults();
  }

  renderLoadingMessage(){
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicatorIOS animating={true}
          color={"#fff"}/>
        <Text style={{color: '#fff'}}>Contacting Unsplash</Text>
      </View>
    );
  }

  renderResults(){
      
    var {wallsJSON, isLoading, isHUDVisible} = this.state;
    if( !isLoading ) {
      return (
        <View>
          <Swiper
            dot = {<View style={{backgroundColor:'rgba(255,255,255,.4)', width: 8, height: 8,borderRadius: 10, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
            activeDot = {<View style={{backgroundColor: '#fff', width: 13, height: 13, borderRadius: 7, marginLeft: 7, marginRight: 7}} />}
            loop={false}
            onMomentumScrollEnd={this.onMomentumScrollEnd}
            index={this.currentWallpaperIndex}
            >
              {wallsJSON.map((wallpaper, index) => {
                return(
                  <View key={index}>
                    <NetworkImage
                      source={{uri: `https://unsplash.it/${wallpaper.width}/${wallpaper.height}?image=${wallpaper.id}`}}
                      indicator={Progress.Circle}
                      style={styles.wallpaperImage}
                      indicatorProps={{
                        color: 'rgba(255, 255, 255)',
                        size: 60,
                        thickness: 1 } }
                      {...this.imagePanResponder.panHandlers}>
                      <Text style={styles.label}>Photo by</Text>
                      <Text style={styles.label_author}>{wallpaper.author}</Text>
                    </NetworkImage>
                  </View>
                );
              })}
          </Swiper>
          <ProgressHUD width={width} height={height} isVisible={isHUDVisible} />
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  wallpaperImage: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#000'
  },
  label: {
    position: 'absolute',
    color: '#fff',
    fontSize: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 2,
    paddingLeft: 5,
    top: 20,
    left: 20,
    width: width/2
  },
  label_author: {
    position: 'absolute',
    color: '#fff',
    fontSize: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 2,
    paddingLeft: 5,
    top: 41,
    left: 20,
    fontWeight: 'bold',
    width: width/2
  }
});

AppRegistry.registerComponent('SplashWalls', () => SplashWalls);
