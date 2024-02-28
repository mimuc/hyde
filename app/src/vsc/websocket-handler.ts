import { GrMLApplication } from '../core/app';
import { UUID } from '../core/element';
import { GrMLAddFunctionEvent, GrMLMessage, GrMLModelChangeEvent, GrMLPortConnectedEvent, GrMLNameChangeEvent, GrMLRemoveEvent, GrMLSelectionChangedEvent, GrMLSubModelSelectedEvent, GrMLPropertiesChangedEvent, GrMLFunctionChangedEvent, SELECTION_TYPE } from '../core/event';
import { GrMLFunction } from '../core/function';
import { GrMLMessageHandler } from '../core/message-handler';
import { GrMLModel } from '../core/model';
import { GrMLFunctionSerialization } from '../core/serializable.interface';


export class GrMLWebsocketMessageHandler implements GrMLMessageHandler {
    private ws: WebSocket;

    constructor (private app: GrMLApplication) {
        this.ws = new WebSocket('ws://localhost:7000');

        this.ws.addEventListener('open', () => {
            this.ws.send(JSON.stringify(this.app.model.serialize()));
        });
        this.ws.addEventListener('message', ({ data }) => {
            // Handle
            try {
                const parsedMessage = JSON.parse(data);
                switch (parsedMessage.command) {
                    case GrMLModelChangeEvent.COMMAND: {
                        const model = GrMLModel.deserialize(parsedMessage.model);
                        this.app.onNewModel(model);
                        break;
                    }
                    case GrMLRemoveEvent.COMMAND: {
                        const uuuidOfFunc = parsedMessage.remove;
                        this.app.model.removeFunction(uuuidOfFunc);
                        break;
                    }
                    case GrMLFunctionChangedEvent.COMMAND: {
                        const newFuncSerialization = <GrMLFunctionSerialization> parsedMessage.func;
                        const funcChanged = this.app.activeModel.getFunctionFromUUID(newFuncSerialization.uuid);
                        funcChanged.updateAll(newFuncSerialization);
                        break;
                    }
                    case GrMLAddFunctionEvent.COMMAND: {
                        const funcToAdd = GrMLFunction.deserialize(parsedMessage.func, this.app.activeModel);
                        const funcAdded = this.app.activeModel.addFunction(funcToAdd, { }, false);
                        // select function after add and do not notify other editors
                        this.app.onFunctionSelect(funcAdded, SELECTION_TYPE.SWITCH, false);
                        break;
                    }
                    case GrMLSelectionChangedEvent.COMMAND: {
                        const selectedFunctions: UUID[] = parsedMessage.selectedFunctions;
                        // highlights function(s) with same uuid
                        this.app.setFunctionsSelectedByUUID(selectedFunctions);
                        break;
                    }
                    case GrMLPortConnectedEvent.COMMAND: {
                        app.addConnection(parsedMessage.connection);
                        break;
                    }
                    case GrMLNameChangeEvent.COMMAND: {
                        const nameEventType = parsedMessage.eventType;
                        const uuid : UUID = parsedMessage.uuid;
                        const name = parsedMessage.name;
                        const parentUUID = parsedMessage.parentUUID;
                        this.app.renameVariable(nameEventType, uuid, name, parentUUID);
                        break;
                    }
                    case GrMLSubModelSelectedEvent.COMMAND: {
                        app.openSubmodelEditor({ modelUUID: parsedMessage.modelUUID });
                        break;
                    }
                    case GrMLPropertiesChangedEvent.COMMAND: {
                        const properties = parsedMessage.properties;
                        console.log('websocket-handler.ts')
                        const funcToUpdate = this.app.activeModel.getFunctionFromUUID(parsedMessage.uuid);
                        if(funcToUpdate){
                            funcToUpdate.properties = properties;
                            funcToUpdate.update();
                        } else {
                            console.error(`Could not update propierties. Function with uuid ${parsedMessage.uuid} not found.`);
                        }
                        break;
                    }

                    default:
                        console.info('Recieved unhandled message from server: ', parsedMessage.command);
                        break;
                }
            } catch (err) {
                console.error('Could not read message from server: ', err);
            }

        });
    }

    public handle (message: GrMLMessage) {
        switch (message.data.command) {
            case GrMLModelChangeEvent.COMMAND: {
                message.data.model = (message as GrMLModelChangeEvent).model.serialize(); // append model to data send to server
                break;
            }
            case GrMLRemoveEvent.COMMAND: {
                message.data.remove = (message as GrMLRemoveEvent).removeUUID; // append index of item to be removed
                break;
            }
            case GrMLAddFunctionEvent.COMMAND: {
                message.data.func = (message as GrMLAddFunctionEvent).func.serialize(); // append new function
                break;
            }
            case GrMLFunctionChangedEvent.COMMAND: {
                message.data.func = (message as GrMLAddFunctionEvent).func.serialize(); // append new function
                break;
            }
            case GrMLSelectionChangedEvent.COMMAND: {
                message.data.selectedFunctions = (message as GrMLSelectionChangedEvent).selectedFunctions;
                break;
            }
            case GrMLPortConnectedEvent.COMMAND: {
                message.data.connection = (message as GrMLPortConnectedEvent).connection;
                break;
            }
            case GrMLNameChangeEvent.COMMAND: {
                message.data.uuid = ( message as GrMLNameChangeEvent ).uuid;
                message.data.eventType = ( message as GrMLNameChangeEvent ).eventType;
                message.data.name = ( message as GrMLNameChangeEvent ).name;
                message.data.parentUUID = ( message as GrMLNameChangeEvent ).parentUUID;
                break;
            }
            case GrMLSubModelSelectedEvent.COMMAND: {
                // appends th uuid of the parent function of the selected model (if a parent exists)
                message.data.modelUUID = (message as GrMLSubModelSelectedEvent).modelPath?.at(-1)?.parent?.uuid || undefined;
                break;
            }
            case GrMLPropertiesChangedEvent.COMMAND: {
                message.data.uuid = ( message as GrMLPropertiesChangedEvent ).uuid;
                message.data.properties = ( message as GrMLPropertiesChangedEvent ).properties;
                break;
            }
            default: return; // do nothing instead of sending
        }
        this.sendToWs(message);
    }

    private sendToWs (message: GrMLMessage) {
        this.ws.send(JSON.stringify(message.data));
    }
}