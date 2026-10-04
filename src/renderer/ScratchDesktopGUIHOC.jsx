import {ipcRenderer, remote} from 'electron';
import bindAll from 'lodash.bindall';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {
    GUIComponent,
    LoadingStates,
    onFetchedProjectData,
    onLoadedProject,
    defaultProjectId,
    requestNewProject,
    requestProjectUpload,
    setProjectId,
    openLoadingProject,
    closeLoadingProject,
    openTelemetryModal
} from '@scratch/scratch-gui';

import ElectronStorageHelper from '../common/ElectronStorageHelper';

import showPrivacyPolicy from './showPrivacyPolicy';
import AIGeneratorModal from './AIGeneratorModal.jsx';

/**
 * Higher-order component to add desktop logic to the GUI.
 * @param {Component} WrappedComponent - a GUI-like component to wrap.
 * @returns {Component} - a component similar to GUI with desktop-specific logic added.
 */
const ScratchDesktopGUIHOC = function (WrappedComponent) {
    class ScratchDesktopGUIComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'handleProjectTelemetryEvent',
                'handleSetTitleFromSave',
                'handleStorageInit',
                'handleUpdateProjectTitle',
                'toggleGenerator'
            ]);
            this.state = {
                isGeneratorOpen: false,
                projectTitle: ''
            };
            this.props.onLoadingStarted();
            ipcRenderer.invoke('get-initial-project-data').then(initialProjectData => {
                const hasInitialProject = initialProjectData && (initialProjectData.length > 0);
                this.props.onHasInitialProject(hasInitialProject, this.props.loadingState);
                if (!hasInitialProject) {
                    this.props.onLoadingCompleted();
                    return;
                }
                this.props.vm.loadProject(initialProjectData).then(
                    () => {
                        this.props.onLoadingCompleted();
                        this.props.onLoadedProject(this.props.loadingState, true);
                    },
                    e => {
                        this.props.onLoadingCompleted();
                        this.props.onLoadedProject(this.props.loadingState, false);
                        remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                            type: 'error',
                            title: 'Failed to load project',
                            message: 'Invalid or corrupt project file.',
                            detail: e.message
                        });

                        // this effectively sets the default project ID
                        // TODO: maybe setting the default project ID should be implicit in `requestNewProject`
                        this.props.onHasInitialProject(false, this.props.loadingState);

                        // restart as if we didn't have an initial project to load
                        this.props.onRequestNewProject();
                    }
                );
            });
        }
        componentDidMount () {
            ipcRenderer.on('setTitleFromSave', this.handleSetTitleFromSave);

            // Expose VM on window for developer console and extensions
            if (typeof window !== 'undefined') {
                window.scratchVM = this.props.vm;
            }

            // Live Bridge IPC: Load project
            this.handleStudioLoadProject = (_event, projectData) => {
                if (this.props.vm) {
                    const dataToLoad = (typeof projectData === 'string') ? projectData : JSON.stringify(projectData);
                    this.props.vm.loadProject(dataToLoad).then(() => {
                        console.log('[Scratch AI Studio] Live project loaded into VM');
                    }).catch(err => {
                        console.error('[Scratch AI Studio] Error loading live project:', err);
                    });
                }
            };
            ipcRenderer.on('studio:loadProject', this.handleStudioLoadProject);

            // Live Bridge IPC: Add sprite
            this.handleStudioAddSprite = (_event, spriteData) => {
                if (this.props.vm) {
                    const dataToAdd = (typeof spriteData === 'string') ? spriteData : JSON.stringify(spriteData);
                    this.props.vm.addSprite(dataToAdd).then(() => {
                        console.log('[Scratch AI Studio] Live sprite added to VM');
                    }).catch(err => {
                        console.error('[Scratch AI Studio] Error adding live sprite:', err);
                    });
                }
            };
            ipcRenderer.on('studio:addSprite', this.handleStudioAddSprite);

            // Live Bridge IPC: Query state
            this.handleStudioGetState = (_event, reqId) => {
                if (this.props.vm && this.props.vm.runtime) {
                    const targets = this.props.vm.runtime.targets.map(t => ({
                        id: t.id,
                        name: t.getName(),
                        isStage: t.isStage,
                        x: t.x,
                        y: t.y,
                        visible: t.visible,
                        direction: t.direction,
                        currentCostume: t.currentCostume
                    }));
                    ipcRenderer.send('studio:stateResponse', {reqId, targets});
                }
            };
            ipcRenderer.on('studio:getState', this.handleStudioGetState);

            // Live Bridge IPC: Query project
            this.handleStudioGetProject = (_event, reqId) => {
                if (this.props.vm) {
                    try {
                        const jsonStr = this.props.vm.toJSON();
                        ipcRenderer.send('studio:projectResponse', {reqId, project: JSON.parse(jsonStr)});
                    } catch (e) {
                        ipcRenderer.send('studio:projectResponse', {reqId, project: null});
                    }
                }
            };
            ipcRenderer.on('studio:getProject', this.handleStudioGetProject);

            // Live Bridge IPC: Open generator modal
            this.handleStudioOpenGenerator = () => {
                console.log('[Scratch AI Studio] Received studio:openGenerator IPC!');
                this.setState({isGeneratorOpen: true});
            };
            ipcRenderer.on('studio:openGenerator', this.handleStudioOpenGenerator);
        }
        componentWillUnmount () {
            ipcRenderer.removeListener('setTitleFromSave', this.handleSetTitleFromSave);
            ipcRenderer.removeListener('studio:loadProject', this.handleStudioLoadProject);
            ipcRenderer.removeListener('studio:addSprite', this.handleStudioAddSprite);
            ipcRenderer.removeListener('studio:getState', this.handleStudioGetState);
            ipcRenderer.removeListener('studio:getProject', this.handleStudioGetProject);
            ipcRenderer.removeListener('studio:openGenerator', this.handleStudioOpenGenerator);
        }
        handleClickAbout () {
            ipcRenderer.send('open-about-window');
        }
        toggleGenerator () {
            console.log('[Scratch AI Studio] toggleGenerator clicked, toggling modal');
            this.setState(prevState => ({isGeneratorOpen: !prevState.isGeneratorOpen}));
        }
        handleProjectTelemetryEvent (event, metadata) {
            ipcRenderer.send(event, metadata);
        }
        handleSetTitleFromSave (event, args) {
            this.handleUpdateProjectTitle(args.title);
        }
        handleStorageInit (storageInstance) {
            storageInstance.addHelper(new ElectronStorageHelper(storageInstance));
        }
        handleUpdateProjectTitle (newTitle) {
            this.setState({projectTitle: newTitle});
        }
        render () {
            const childProps = omit(this.props, Object.keys(ScratchDesktopGUIComponent.propTypes));

            return (
                <React.Fragment>
                    <WrappedComponent
                        canEditTitle
                        canModifyCloudData={false}
                        canSave={false}
                        onClickAbout={[
                            {
                                title: '⚡ ИИ Генератор уровней',
                                onClick: () => this.toggleGenerator()
                            },
                            {
                                title: 'About',
                                onClick: () => this.handleClickAbout()
                            },
                            {
                                title: 'Privacy Policy',
                                onClick: () => showPrivacyPolicy()
                            },
                            {
                                title: 'Data Settings',
                                onClick: () => this.props.onTelemetrySettingsClicked()
                            }
                        ]}
                        onProjectTelemetryEvent={this.handleProjectTelemetryEvent}
                        onShowPrivacyPolicy={showPrivacyPolicy}
                        onStorageInit={this.handleStorageInit}
                        onUpdateProjectTitle={this.handleUpdateProjectTitle}
                        platform="DESKTOP"

                        // allow passed-in props to override any of the above
                        {...childProps}
                    />

                    {/* Sleek Floating Launcher Button in Header */}
                    <div style={{position: 'fixed', top: '6px', right: '175px', zIndex: 9999}}>
                        <button
                            type="button"
                            onClick={this.toggleGenerator}
                            title="Открыть ИИ Генератор уровней"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 10px rgba(79, 70, 229, 0.5)'
                            }}
                        >
                            <span>⚡</span> ИИ Генератор
                        </button>
                    </div>

                    {/* Integrated AI Generator Modal */}
                    <AIGeneratorModal
                        isOpen={this.state.isGeneratorOpen}
                        onClose={this.toggleGenerator}
                        vm={this.props.vm}
                    />
                </React.Fragment>
            );
        }
    }

    ScratchDesktopGUIComponent.propTypes = {
        loadingState: PropTypes.oneOf(LoadingStates),
        onFetchedInitialProjectData: PropTypes.func,
        onHasInitialProject: PropTypes.func,
        onLoadedProject: PropTypes.func,
        onLoadingCompleted: PropTypes.func,
        onLoadingStarted: PropTypes.func,
        onRequestNewProject: PropTypes.func,
        onTelemetrySettingsClicked: PropTypes.func,
        vm: GUIComponent.WrappedComponent.propTypes.vm
    };
    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            loadingState: loadingState,
            vm: state.scratchGui.vm
        };
    };
    const mapDispatchToProps = dispatch => ({
        onLoadingStarted: () => dispatch(openLoadingProject()),
        onLoadingCompleted: () => dispatch(closeLoadingProject()),
        onHasInitialProject: (hasInitialProject, loadingState) => {
            if (hasInitialProject) {
                // emulate sb-file-uploader
                return dispatch(requestProjectUpload(loadingState));
            }

            // `createProject()` might seem more appropriate but it's not a valid state transition here
            // setting the default project ID is a valid transition from NOT_LOADED and acts like "create new"
            return dispatch(setProjectId(defaultProjectId));
        },
        onFetchedInitialProjectData: (projectData, loadingState) =>
            dispatch(onFetchedProjectData(projectData, loadingState)),
        onLoadedProject: (loadingState, loadSuccess) => {
            const canSaveToServer = false;
            return dispatch(onLoadedProject(loadingState, canSaveToServer, loadSuccess));
        },
        onRequestNewProject: () => dispatch(requestNewProject(false)),
        onTelemetrySettingsClicked: () => dispatch(openTelemetryModal())
    });

    return connect(mapStateToProps, mapDispatchToProps)(ScratchDesktopGUIComponent);
};

export default ScratchDesktopGUIHOC;
