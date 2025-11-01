import { ReactNative, React } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { useAuthorizationStore } from "./utils/AuthorizationStore";
import { BASE_URL } from "./utils/constants";
import { semanticColors } from "@vendetta/ui";
import { stylesheet } from "@vendetta/metro/common";

const { ScrollView, View, Text, ActivityIndicator } = ReactNative;
const { FormRow, FormArrow } = Forms;

const styles = stylesheet.createThemedStyleSheet({
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: semanticColors.BACKGROUND_PRIMARY,
    },
    errorText: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
        color: semanticColors.TEXT_NORMAL,
    },
    hintText: {
        fontSize: 14,
        color: semanticColors.TEXT_MUTED,
        textAlign: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: semanticColors.TEXT_MUTED,
    },
    savingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0)",
        justifyContent: "center",
        alignItems: "center",
    },
    savingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#fff",
        fontWeight: "bold",
    },
    titleContainer: {
        marginBottom: 8,
        marginHorizontal: 16,
        marginTop: 16,
        gap: 4,
        flexDirection: "row",
        alignItems: "center",
    },
    titleText: {
        fontSize: 14,
        fontWeight: "600",
        color: semanticColors.TEXT_MUTED,
    },
    icon: {
        width: 16,
        height: 16,
        marginTop: 1.5,
        tintColor: semanticColors.TEXT_MUTED,
    },
});

function BetterTableRowGroup({title, icon, children,}: React.PropsWithChildren<{title?: string;icon?: number;}>) {
    const groupStyles = stylesheet.createThemedStyleSheet({
        main: {
            backgroundColor: semanticColors.CARD_PRIMARY_BG,
            borderColor: semanticColors.BORDER_FAINT,
            borderWidth: 1,
            borderRadius: 16,
            overflow: "hidden",
            flex: 1,
        },
    });

    return (
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            {title && (
                <View style={styles.titleContainer}>
                    {icon && (
                        <ReactNative.Image
                            style={styles.icon}
                            source={icon}
                            resizeMode="cover"
                        />
                    )}
                    <Text style={styles.titleText}>
                        {title.toUpperCase()}
                    </Text>
                </View>
            )}
            <View style={groupStyles.main}>
                {children}
            </View>
        </View>
    );
}

export default function SaveCGifPage({ gifData }) {
    const [categories, setCategories] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const { token, isAuthorized } = useAuthorizationStore.getState();

    React.useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        if (!isAuthorized()) {
            showToast("Please login first", getAssetIDByName("Small"));
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/user/data`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            } else {
                showToast("Failed to load categories", getAssetIDByName("Small"));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("Error loading categories", getAssetIDByName("Small"));
        } finally {
            setLoading(false);
        }
    }

    async function saveToCategory(categoryName) {
        setSaving(true);

        try {
            const response = await fetch(`${BASE_URL}/user/gif`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categoryName: categoryName,
                    gif: gifData
                })
            });

            if (response.ok) {
                showToast(`Saved to ${categoryName}`, getAssetIDByName("Check"));
                await fetchCategories();
            } else {
                showToast("Failed to save GIF", getAssetIDByName("Small"));
            }
        } catch (error) {
            console.error("Error saving gif:", error);
            showToast("Error saving GIF", getAssetIDByName("Small"));
        } finally {
            setSaving(false);
        }
    }

    if (!isAuthorized()) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Please login to save GIFs</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
        );
    }

    if (categories.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>No categories yet</Text>
                <Text style={styles.hintText}>Create your first category by going into the Plugin settings</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <BetterTableRowGroup>
                {categories.map((category, index) => (
                <React.Fragment key={category.name}>

                    <FormRow
                        key={category.name}
                        label={category.name}
                        subLabel={`${category.gifs?.length || 0} GIFs`}

                        trailing={FormArrow}
                        onPress={() => saveToCategory(category.name)}
                        disabled={saving}
                    />
                    {index < categories.length - 1 && (<Forms.FormDivider />)}
                </React.Fragment>


                ))}
            </BetterTableRowGroup>

            <View style={{ height: 32 }} />

            {saving && (
                <View style={styles.savingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.savingText}>Saving...</Text>
                </View>
            )}
        </ScrollView>
    );
}
