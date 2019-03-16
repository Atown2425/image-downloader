/* eslint-env webextensions */
import { action, computed, decorate, observable } from 'mobx';
import { getSavedOptions } from '../utils/index';
import { KEY } from '../utils/constants';

class SettingsModel {
  subfolder = '';
  filter = '';
  // filterType 0: normal, 1: wildcard, 2: regex
  filterType = 0;
  minWidth = 0;
  minWidthEnabled = false;
  maxWidth = 3000;
  maxWidthEnabled = false;
  minHeight = 0;
  minHeightEnabled = false;
  maxHeight = 3000;
  maxHeightEnabled = false;
  onlyImagesFromLink = false;

  get values() {
    return {
      subfolder: this.subfolder,
      filter: this.filter,
      filterType: this.filterType,
      minWidth: this.minWidth,
      minWidthEnabled: this.minWidthEnabled,
      maxWidth: this.maxWidth,
      maxWidthEnabled: this.maxWidthEnabled,
      minHeight: this.minHeight,
      minHeightEnabled: this.minHeightEnabled,
      maxHeight: this.maxHeight,
      maxHeightEnabled: this.maxHeightEnabled,
      onlyImagesFromLink: this.onlyImagesFromLink
    };
  }

  set values(values) {
    const {
      subfolder,
      filter,
      filterType,
      minWidth,
      minWidthEnabled,
      maxWidth,
      maxWidthEnabled,
      minHeight,
      minHeightEnabled,
      maxHeight,
      maxHeightEnabled,
      onlyImagesFromLink
    } = values;

    this.subfolder = subfolder;
    this.filter = filter;
    this.filterType = filterType;
    this.minWidth = minWidth;
    this.minWidthEnabled = minWidthEnabled;
    this.maxWidth = maxWidth;
    this.maxWidthEnabled = maxWidthEnabled;
    this.minHeight = minHeight;
    this.minHeightEnabled = minHeightEnabled;
    this.maxHeight = maxHeight;
    this.maxHeightEnabled = maxHeightEnabled;
    this.onlyImagesFromLink = onlyImagesFromLink;
  }

  /********************************************************************
   * Action
   ********************************************************************/

  applySettingsFromLocalStorage() {
    getSavedOptions(KEY).then(settings => {
      if (settings === null) {
        return;
      }

      this.values = settings;
    });
  }
}

decorate(SettingsModel, {
  // observable
  subfolder: observable,
  filter: observable,
  filterType: observable,
  minWidth: observable,
  minWidthEnabled: observable,
  maxWidth: observable,
  maxWidthEnabled: observable,
  minHeight: observable,
  minHeightEnabled: observable,
  maxHeight: observable,
  maxHeightEnabled: observable,
  onlyImagesFromLink: observable,
  // computed
  values: computed,
  // action
  applySettingsFromLocalStorage: action.bound
});

const settingsModel = new SettingsModel();
export default settingsModel;