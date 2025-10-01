import {findByProps} from '@vendetta/metro';
import {React, ReactNative, url, stylesheet} from '@vendetta/metro/common';
import {storage} from '@vendetta/plugin';
import {showConfirmationAlert} from '@vendetta/ui/alerts';
import {getAssetIDByName} from '@vendetta/ui/assets';
import {semanticColors} from "@vendetta/ui";
import {Forms, HelpMessage as _HelpMessage} from '@vendetta/ui/components';
import showAuthorizationModal from '../../lib/utils/showAuthorizationModal';
import DecorationPicker from '../components/DecorationPicker';
import Icon from '../components/Icon';
import {useAuthorizationStore} from '../../lib/stores/AuthorizationStore';


const styles = stylesheet.createThemedStyleSheet({
    versionText: {
        fontSize: 15,
        color: semanticColors.TEXT_NORMAL,
        textAlign: "center",
        fontWeight: "600",
        lineHeight: 22,
    },
});


//No idea why this exists
//const { triggerHapticFeedback, HapticFeedbackTypes } = findByProps('triggerHapticFeedback');

const {ScrollView, View} = ReactNative;
const {FormSection, FormRow, FormArrow, FormSwitchRow, FormCTAButton, FormDivider, FormInput, useReducer} = Forms;
const HelpMessage = _HelpMessage as any;

//Seems broken, using non-aware ScrollView for now
//const { KeyboardAwareScrollView } = findByProps('KeyboardAwareScrollView');

export default function Settings() {
    const {isAuthorized} = useAuthorizationStore()

    return (
        <ScrollView>
            {!isAuthorized() && (
                <View style={{padding: 8}}>
                    <HelpMessage messageType={0}>You need to Authorize with Decor before you can get custom
                        decorations.</HelpMessage>
                </View>
            )}

            <DecorationPicker/>

            {!isAuthorized() && (
                <FormSection>
                    <FormRow
                        label="Authorize with Decor"
                        leading={<Icon source={getAssetIDByName('ic_link_24px')}/>}
                        trailing={FormArrow}
                        onPress={showAuthorizationModal}
                    />
                </FormSection>
            )}

            {isAuthorized() && (
                <FormCTAButton
                    color="danger"
                    label="Logout"
                    onPress={() =>
                        showConfirmationAlert({
                            title: "Logout",
                            content: "Are you sure you want to logout?",
                            confirmText: "Logout",
                            confirmColor: 'red' as ButtonColors.RED,
                            cancelText: "Cancel",
                            onConfirm: () => {
                                storage.token = undefined;
                                useAuthorizationStore.getState().setToken(null);
                            }
                        })
                    }
                />
            )}

            <FormCTAButton
                color="brand"
                label="Source"
                onPress={() =>
                    ReactNative.Linking.openURL("https://github.com/bwlok/revenge-plugins/tree/master/plugins/Decor")
                }
            />

            <ReactNative.Text style={styles.versionText}>
                Decor{'\n'}
                Version 1.0.0

            </ReactNative.Text>

            <View style={{height: 40}}/>
        </ScrollView>
    );
}
