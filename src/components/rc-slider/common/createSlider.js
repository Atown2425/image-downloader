import React from 'react';
import PropTypes from 'prop-types';
import addEventListener from 'rc-util/lib/Dom/addEventListener';
import classNames from 'classnames';
import warning from 'warning';
import Steps from './Steps';
import Marks from './Marks';
import Handle from '../Handle';
import * as utils from '../utils';

function noop() {}

export default function createSlider(Component) {
  return class ComponentEnhancer extends Component {
    static displayName = `ComponentEnhancer(${Component.displayName})`;
    static propTypes = {
      ...Component.propTypes,
      min: PropTypes.number,
      max: PropTypes.number,
      step: PropTypes.number,
      marks: PropTypes.object,
      included: PropTypes.bool,
      className: PropTypes.string,
      prefixCls: PropTypes.string,
      disabled: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.arrayOf(PropTypes.bool)
      ]),
      children: PropTypes.any,
      onBeforeChange: PropTypes.func,
      onChange: PropTypes.func,
      onAfterChange: PropTypes.func,
      handle: PropTypes.func,
      dots: PropTypes.bool,
      vertical: PropTypes.bool,
      style: PropTypes.object,
      // just for compatibility, will be deprecated
      minimumTrackStyle: PropTypes.object,
      // just for compatibility, will be deprecated
      maximumTrackStyle: PropTypes.object,
      handleStyle: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.object)
      ]),
      trackStyle: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.object)
      ]),
      railStyle: PropTypes.object,
      dotStyle: PropTypes.object,
      activeDotStyle: PropTypes.object,
      autoFocus: PropTypes.bool,
      onFocus: PropTypes.func,
      onBlur: PropTypes.func,
    };

    static defaultProps = {
      ...Component.defaultProps,
      prefixCls: 'rc-slider',
      className: '',
      min: 0,
      max: 100,
      step: 1,
      marks: {},
      handle({ index, ...restProps }) {
        delete restProps.dragging;
        return (
          <Handle
            {...restProps}
            key={index}
          />
        );
      },
      onBeforeChange: noop,
      onChange: noop,
      onAfterChange: noop,
      included: true,
      disabled: false,
      dots: false,
      vertical: false,
      trackStyle: [{}],
      handleStyle: [{}],
      railStyle: {},
      dotStyle: {},
      activeDotStyle: {},
    };

    constructor(props) {
      super(props);

      if (process.env.NODE_ENV !== 'production') {
        const { step, max, min } = props;
        warning(
          step && Math.floor(step) === step ? (max - min) % step === 0 : true,
          'Slider[max] - Slider[min] (%s) should be a multiple of Slider[step] (%s)',
          max - min,
          step
        );
      }

      this.sliderRef = null
      this.handlesRefs = {};
    }

    componentDidMount() {
      // Snapshot testing cannot handle refs, so be sure to null-check this.
      this.document = this.sliderRef && this.sliderRef.ownerDocument;
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) {
        super.componentWillUnmount();
      }

      this.removeDocumentEvents();
    }

    onMouseDown = (e) => {
      console.log('onMouseDown')
      if (e.button !== 0) {
        return;
      }

      const isVertical = this.props.vertical;
      let position = utils.getMousePosition(isVertical, e);

      if (!utils.isEventFromHandle(e, this.handlesRefs)) {
        this.dragOffset = 0;
      } else {
        const handlePosition = utils.getHandleCenterPosition(isVertical, e.target);
        this.dragOffset = position - handlePosition;
        position = handlePosition;
      }
      console.log('position:', position)

      this.removeDocumentEvents();
      this.onStart(position);
      this.addDocumentMouseEvents();
    }

    onTouchStart = (e) => {
      console.log('onTouchStart')
      if (utils.isNotTouchEvent(e))
        return;

      const isVertical = this.props.vertical;
      let position = utils.getTouchPosition(isVertical, e);

      if (!utils.isEventFromHandle(e, this.handlesRefs)) {
        this.dragOffset = 0;
      } else {
        const handlePosition = utils.getHandleCenterPosition(isVertical, e.target);
        this.dragOffset = position - handlePosition;
        position = handlePosition;
      }

      this.onStart(position);
      this.addDocumentTouchEvents();
      utils.pauseEvent(e);
    }

    onFocus = (e) => {
      console.log('onFocus')
      const { onFocus, vertical } = this.props;

      if (utils.isEventFromHandle(e, this.handlesRefs)) {
        const handlePosition = utils.getHandleCenterPosition(vertical, e.target);
        this.dragOffset = 0;
        this.onStart(handlePosition);
        utils.pauseEvent(e);

        if (onFocus) {
          onFocus(e);
        }
      }
    }

    onBlur = (e) => {
      console.log('onBlur')
      const { onBlur } = this.props;
      this.onEnd(e);

      if (onBlur) {
        onBlur(e);
      }
    };

    onMouseUp = () => {
      console.log('onMouseUp')
      if (this.handlesRefs[this.prevMovedHandleIndex]) {
        this.handlesRefs[this.prevMovedHandleIndex].clickFocus();
      }
    }

    onMouseMove = (e) => {
      if (!this.sliderRef) {
        this.onEnd();
        return;
      }

      const position = utils.getMousePosition(this.props.vertical, e);
      this.onMove(e, position - this.dragOffset);
    }

    onTouchMove = (e) => {
      if (utils.isNotTouchEvent(e) || !this.sliderRef) {
        this.onEnd();
        return;
      }

      const position = utils.getTouchPosition(this.props.vertical, e);
      this.onMove(e, position - this.dragOffset);
    }

    onKeyDown = (e) => {
      console.log('onKeyDown')
      if (this.sliderRef && utils.isEventFromHandle(e, this.handlesRefs)) {
        this.onKeyboard(e);
      }
    }

    onClickMarkLabel = (e, value) => {
      e.stopPropagation();
      this.onChange({ value });
    }

    getSliderStart() {
      const slider = this.sliderRef;
      const rect = slider.getBoundingClientRect();

      return this.props.vertical
        ? rect.top
        : rect.left;
    }

    getSliderLength() {
      const slider = this.sliderRef;
      if (!slider) {
        return 0;
      }

      const coords = slider.getBoundingClientRect();
      return this.props.vertical
        ? coords.height
        : coords.width;
    }

    addDocumentMouseEvents() {
      this.onMouseMoveListener = addEventListener(this.document, 'mousemove', this.onMouseMove);
      this.onMouseUpListener = addEventListener(this.document, 'mouseup', this.onEnd);
    }

    addDocumentTouchEvents() {
      // just work for Chrome iOS Safari and Android Browser
      this.onTouchMoveListener = addEventListener(this.document, 'touchmove', this.onTouchMove);
      this.onTouchUpListener = addEventListener(this.document, 'touchend', this.onEnd);
    }

    removeDocumentEvents() {
      /* eslint-disable no-unused-expressions */
      this.onTouchMoveListener && this.onTouchMoveListener.remove();
      this.onTouchUpListener && this.onTouchUpListener.remove();

      this.onMouseMoveListener && this.onMouseMoveListener.remove();
      this.onMouseUpListener && this.onMouseUpListener.remove();
      /* eslint-enable no-unused-expressions */
    }

    focus() {
      if (!this.props.disabled) {
        this.handlesRefs[0].focus();
      }
    }

    blur() {
      if (!this.props.disabled) {
        this.handlesRefs[0].blur();
      }
    }

    calcValue(offset) {
      const { vertical, min, max } = this.props;
      const ratio = Math.abs(Math.max(offset, 0) / this.getSliderLength());

      return vertical
        ? (1 - ratio) * (max - min) + min
        : ratio * (max - min) + min;
    }

    calcValueByPos(position) {
      const pixelOffset = position - this.getSliderStart();
      return this.trimAlignValue(this.calcValue(pixelOffset));
    }

    calcOffset(value) {
      const { min, max } = this.props;
      const ratio = (value - min) / (max - min);
      return ratio * 100;
    }

    saveSlider = (slider) => {
      this.sliderRef = slider;
    }

    saveHandle(index, handle) {
      this.handlesRefs[index] = handle;
    }

    render() {
      const {
        prefixCls,
        className,
        marks,
        dots,
        step,
        included,
        disabled,
        vertical,
        min,
        max,
        children,
        maximumTrackStyle,
        style,
        railStyle,
        dotStyle,
        activeDotStyle,

      } = this.props;

      const {
        tracks,
        handles

      } = super.render();

      const sliderClassName = classNames(prefixCls, {
        [`${prefixCls}-with-marks`]: Object.keys(marks).length,
        [`${prefixCls}-disabled`]: Array.isArray(disabled)
          ? disabled.filter(v => v).length === disabled.length
          : disabled,
        [`${prefixCls}-vertical`]: vertical,
        [className]: className,
      });

      return (
        <div
          ref={this.saveSlider}
          className={sliderClassName}
          onTouchStart={disabled === true ? noop : this.onTouchStart}
          onMouseDown={disabled === true ? noop : this.onMouseDown}
          onMouseUp={disabled === true ? noop : this.onMouseUp}
          onKeyDown={disabled === true ? noop : this.onKeyDown}
          onFocus={disabled === true ? noop : this.onFocus}
          onBlur={disabled === true ? noop : this.onBlur}
          style={style}
        >
          <div
            className={`${prefixCls}-rail`}
            style={{
              ...maximumTrackStyle,
              ...railStyle,
            }}
          />

          {tracks}

          <Steps
            prefixCls={prefixCls}
            vertical={vertical}
            marks={marks}
            dots={dots}
            step={step}
            included={included}
            lowerBound={this.getLowerBound()}
            upperBound={this.getUpperBound()}
            max={max}
            min={min}
            dotStyle={dotStyle}
            activeDotStyle={activeDotStyle}
          />

          {handles}

          <Marks
            className={`${prefixCls}-mark`}
            onClickLabel={disabled ? noop : this.onClickMarkLabel}
            vertical={vertical}
            marks={marks}
            included={included}
            lowerBound={this.getLowerBound()}
            upperBound={this.getUpperBound()}
            max={max}
            min={min}
          />

          {children}

        </div>
      );
    }
  };
}