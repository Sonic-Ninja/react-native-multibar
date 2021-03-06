import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Animated, TouchableOpacity, TouchableWithoutFeedback, Vibration, View} from 'react-native';

import {Colors} from "../utils";

const DEFAULT_TOGGLE_SIZE = 80;
const DEFAULT_ACTION_SIZE = 40;
const DEFAULT_TOGGLE_ANIMATION_DURATION = 300;
const DEFAULT_ACTION_STAGING_DURATION = 100;
const DEFAULT_ACTION_ANIMATION_DURATION = 200;
const DEFAULT_NAVIGATION_DELAY = 500;
const DEFAULT_EXPANDING_ANGLE = 135;

class MultiBarToggle extends Component {
    activation = new Animated.Value(0);

    state = {
        measured: false,
        active: false
    };

    actionPressed = (route) => {
        this.togglePressed();

        const {
            actionVibration,
            navigationDelay
        } = this.props;

        actionVibration && Vibration.vibrate();

        if (route.routeName) {
            setTimeout(() => this.props.navigation.navigate({
                routeName: route.routeName
            }), navigationDelay);
        }

        route.onPress && route.onPress();
    };

    togglePressed = () => {
        const {
            routes,
            toggleVibration,
            toggleAnimationDuration,
            actionAnimationDuration,
            actionStagingDuration
        } = this.props;

        if (this.state.active) {
            this.setState({active: false});

            Animated.parallel([
                Animated.timing(this.activation, {toValue: 0, duration: toggleAnimationDuration}),
                Animated.stagger(actionStagingDuration, routes.map((v, i) => Animated.timing(this[`actionActivation_${(routes.length - 1) - i}`], {
                    toValue: 0,
                    duration: actionAnimationDuration
                })))
            ]).start();
        } else {
            this.setState({active: true});

            Animated.parallel([
                Animated.timing(this.activation, {toValue: 1, duration: toggleAnimationDuration}),
                Animated.stagger(actionStagingDuration, routes.map((v, i) => Animated.timing(this[`actionActivation_${i}`], {
                    toValue: 1,
                    duration: actionAnimationDuration
                })))
            ]).start();
        }

        toggleVibration && Vibration.vibrate();
    };

    renderActions = () => {
        const {
            routes,
            actionSize,
            actionExpandingAngle
        } = this.props;

        const STEP = actionExpandingAngle / routes.length;

        return routes.map((route, i) => {
            const offset = (STEP * (i + 1)) / DEFAULT_EXPANDING_ANGLE - 0.5;
            const angle = -90 + (DEFAULT_EXPANDING_ANGLE * offset) - (STEP / 2);
            const radius = 80;

            const x = radius * Math.cos(-angle * Math.PI / 180);
            const y = radius * Math.sin(-angle * Math.PI / 180);

            const activationScale = this[`actionActivation_${i}`].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0, 1]
            });

            const activationPositionX = this[`actionActivation_${i}`].interpolate({
                inputRange: [0, 1],
                outputRange: [0, x]
            });

            const activationPositionY = this[`actionActivation_${i}`].interpolate({
                inputRange: [0, 1],
                outputRange: [0, y]
            });

            return (
                <Animated.View
                    key={`action_${i}`}
                    style={[Styles.actionContainer, {
                        marginLeft: -actionSize / 2,
                        left: activationPositionX,
                        bottom: activationPositionY,
                        transform: [
                            {scale: activationScale}
                        ]
                    }]}
                >
                    <TouchableOpacity
                        style={[Styles.actionContent, {
                            width: actionSize,
                            height: actionSize,
                            borderRadius: actionSize / 2,
                            backgroundColor: route.color,
                        }]}
                        onPress={() => this.actionPressed(route)}
                    >
                        {route.icon}
                    </TouchableOpacity>
                </Animated.View>
            );
        })
    };

    /**
     * Create animation values for each action.
     */
    makeActivations = (routes) => {
        routes.forEach((v, i) => this[`actionActivation_${i}`] = new Animated.Value(0));
        this.setState({measured: true});
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.routes !== this.props.routes) {
            this.makeActivations(nextProps.routes);
        }
    }

    componentDidMount() {
        this.makeActivations(this.props.routes);
    }

    render() {
        const {
            icon,
            toggleColor,
            toggleSize
        } = this.props;

        const activationRotate = this.activation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '135deg']
        });

        const activationScale = this.activation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.25, 1]
        });

        return (
            <View
                pointerEvents="box-none"
                style={Styles.container}
            >
                {
                    this.state.measured &&
                    <View style={Styles.actionsWrapper}>
                        {this.renderActions()}
                    </View>
                }
                <TouchableWithoutFeedback
                    onPress={this.togglePressed}
                >
					<View>
						<Animated.View style={[Styles.toggleButton, {
							transform: [
								{rotate: activationRotate},
								{scale: activationScale}
							],
							width: toggleSize,
							height: toggleSize,
							borderRadius: toggleSize / 2,
							backgroundColor: toggleColor
						}]}>
							{icon}
						</Animated.View>
					</View>
                </TouchableWithoutFeedback>
            </View>
        );
    }
}

MultiBarToggle.propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape({
        routeName: PropTypes.string,
        color: PropTypes.string,
        icon: PropTypes.node
    })),
    actionSize: PropTypes.number,
    actionVibration: PropTypes.bool,
    actionExpandingAngle: PropTypes.number,
    toggleVibration: PropTypes.bool,
    toggleColor: PropTypes.string,
    toggleSize: PropTypes.number,
    toggleAnimationDuration: PropTypes.number,
    actionAnimationDuration: PropTypes.number,
    actionStagingDuration: PropTypes.number,
    navigationDelay: PropTypes.number,
    icon: PropTypes.node

};

MultiBarToggle.defaultProps = {
    routes: [],
    actionSize: DEFAULT_ACTION_SIZE,
    actionExpandingAngle: DEFAULT_EXPANDING_ANGLE,
    toggleColor: Colors.toggleColor,
    toggleSize: DEFAULT_TOGGLE_SIZE,
    navigationDelay: DEFAULT_NAVIGATION_DELAY,
    toggleAnimationDuration: DEFAULT_TOGGLE_ANIMATION_DURATION,
    actionAnimationDuration: DEFAULT_ACTION_ANIMATION_DURATION,
    actionStagingDuration: DEFAULT_ACTION_STAGING_DURATION
};

const Styles = {
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    toggleButton: {
        top: 15,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center'
    },
    toggleIcon: {
        fontSize: 30,
        color: 'white'
    },
    actionsWrapper: {
        position: 'absolute',
        bottom: 0
    },
    actionContainer: {
        position: 'absolute'
    },
    actionContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export {MultiBarToggle};