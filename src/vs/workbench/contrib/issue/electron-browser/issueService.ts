/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IssueReporterStyles, IssueReporterData, ProcessExplorerData, IssueReporterExtensionData } from 'vs/platform/issue/common/issue';
import { IIssueService } from 'vs/platform/issue/electron-sandbox/issue';
import { IColorTheme, IThemeService } from 'vs/platform/theme/common/themeService';
import { textLinkForeground, inputBackground, inputBorder, inputForeground, buttonBackground, buttonHoverBackground, buttonForeground, inputValidationErrorBorder, foreground, inputActiveOptionBorder, scrollbarSliderActiveBackground, scrollbarSliderBackground, scrollbarSliderHoverBackground, editorBackground, editorForeground, listHoverBackground, listHoverForeground, listHighlightForeground, textLinkActiveForeground, inputValidationErrorBackground, inputValidationErrorForeground } from 'vs/platform/theme/common/colorRegistry';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';
import { IExtensionManagementService } from 'vs/platform/extensionManagement/common/extensionManagement';
import { IWorkbenchExtensionEnablementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement';
import { getZoomLevel } from 'vs/base/browser/browser';
import { IWorkbenchIssueService } from 'vs/workbench/contrib/issue/electron-browser/issue';
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService';
import { INativeWorkbenchEnvironmentService } from 'vs/workbench/services/environment/electron-browser/environmentService';
import { ExtensionType } from 'vs/platform/extensions/common/extensions';

export class WorkbenchIssueService implements IWorkbenchIssueService {
	declare readonly _serviceBrand: undefined;

	constructor(
		@IIssueService private readonly issueService: IIssueService,
		@IThemeService private readonly themeService: IThemeService,
		@IExtensionManagementService private readonly extensionManagementService: IExtensionManagementService,
		@IWorkbenchExtensionEnablementService private readonly extensionEnablementService: IWorkbenchExtensionEnablementService,
		@IWorkbenchEnvironmentService private readonly environmentService: INativeWorkbenchEnvironmentService
	) { }

	async openReporter(dataOverrides: Partial<IssueReporterData> = {}): Promise<void> {
		const extensions = await this.extensionManagementService.getInstalled();
		const enabledExtensions = extensions.filter(extension => this.extensionEnablementService.isEnabled(extension));
		const extensionData = enabledExtensions.map((extension): IssueReporterExtensionData => {
			const { manifest } = extension;
			const manifestKeys = manifest.contributes ? Object.keys(manifest.contributes) : [];
			const isTheme = !manifest.activationEvents && manifestKeys.length === 1 && manifestKeys[0] === 'themes';
			const isBuiltin = extension.type === ExtensionType.System;
			return {
				name: manifest.name,
				publisher: manifest.publisher,
				version: manifest.version,
				repositoryUrl: manifest.repository && manifest.repository.url,
				bugsUrl: manifest.bugs && manifest.bugs.url,
				displayName: manifest.displayName,
				id: extension.identifier.id,
				isTheme,
				isBuiltin,
			};
		});
		const theme = this.themeService.getColorTheme();
		const issueReporterData: IssueReporterData = Object.assign({
			styles: getIssueReporterStyles(theme),
			zoomLevel: getZoomLevel(),
			enabledExtensions: extensionData,
		}, dataOverrides);
		return this.issueService.openReporter(issueReporterData);
	}

	openProcessExplorer(): Promise<void> {
		const theme = this.themeService.getColorTheme();
		const data: ProcessExplorerData = {
			pid: this.environmentService.configuration.mainPid,
			zoomLevel: getZoomLevel(),
			styles: {
				backgroundColor: getColor(theme, editorBackground),
				color: getColor(theme, editorForeground),
				hoverBackground: getColor(theme, listHoverBackground),
				hoverForeground: getColor(theme, listHoverForeground),
				highlightForeground: getColor(theme, listHighlightForeground),
			}
		};
		return this.issueService.openProcessExplorer(data);
	}
}

export function getIssueReporterStyles(theme: IColorTheme): IssueReporterStyles {
	return {
		backgroundColor: getColor(theme, SIDE_BAR_BACKGROUND),
		color: getColor(theme, foreground),
		textLinkColor: getColor(theme, textLinkForeground),
		textLinkActiveForeground: getColor(theme, textLinkActiveForeground),
		inputBackground: getColor(theme, inputBackground),
		inputForeground: getColor(theme, inputForeground),
		inputBorder: getColor(theme, inputBorder),
		inputActiveBorder: getColor(theme, inputActiveOptionBorder),
		inputErrorBorder: getColor(theme, inputValidationErrorBorder),
		inputErrorBackground: getColor(theme, inputValidationErrorBackground),
		inputErrorForeground: getColor(theme, inputValidationErrorForeground),
		buttonBackground: getColor(theme, buttonBackground),
		buttonForeground: getColor(theme, buttonForeground),
		buttonHoverBackground: getColor(theme, buttonHoverBackground),
		sliderActiveColor: getColor(theme, scrollbarSliderActiveBackground),
		sliderBackgroundColor: getColor(theme, scrollbarSliderBackground),
		sliderHoverColor: getColor(theme, scrollbarSliderHoverBackground),
	};
}

function getColor(theme: IColorTheme, key: string): string | undefined {
	const color = theme.getColor(key);
	return color ? color.toString() : undefined;
}
