import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import {
  React,
  ReactNative as RN,
  stylesheet,
} from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

import { showToast } from "@vendetta/ui/toasts";
import showAuthorizationModal from "./utils/showAuthorizationModal";
import { useAuthorizationStore } from "./utils/AuthorizationStore";
import { BASE_URL } from "./utils/constants";

const { ScrollView, View, Text, ActivityIndicator, TouchableOpacity } = RN;
const { FormRow, FormArrow, FormDivider, FormInput, FormCTAButton } = Forms;

const styles = stylesheet.createThemedStyleSheet({
  versionText: {
    fontSize: 15,
    color: semanticColors.TEXT_NORMAL,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 22,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "600",
    color: semanticColors.TEXT_MUTED,
  },
  authText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    padding: 15,
    color: semanticColors.TEXT_BRAND,
  },
  titleContainer: {
    marginBottom: 8,
    marginHorizontal: 0,
    marginTop: 8,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButton: {
    backgroundColor: semanticColors.BUTTON_POSITIVE_BACKGROUND,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: semanticColors.BUTTON_DANGER_BACKGROUND,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: semanticColors.TEXT_MUTED,
  },
  emptyText: {
    padding: 20,
    textAlign: "center",
    fontSize: 14,
    color: semanticColors.TEXT_MUTED,
  },
});

function BetterTableRowGroup({
  title,
  icon,
  children,
  padding = false,
  action,
}: React.PropsWithChildren<{
  title?: string;
  icon?: number;
  padding?: boolean;
  action?: React.ReactNode;
}>) {
  const groupStyles = stylesheet.createThemedStyleSheet({
    main: {
      backgroundColor: semanticColors.CARD_PRIMARY_BG,
      borderColor: semanticColors.BORDER_FAINT,
      borderWidth: 1,
      borderRadius: 16,
      overflow: "hidden",
      flex: 1,
    },
    icon: {
      width: 16,
      height: 16,
      marginTop: 1.5,
      tintColor: semanticColors.TEXT_MUTED,
    },
  });

  return (
    <RN.View style={{ marginHorizontal: 16, marginTop: 16 }}>
      {title && (
        <RN.View style={styles.titleContainer}>
          <RN.View style={styles.titleLeft}>
            {icon && (
              <RN.Image
                style={groupStyles.icon}
                source={icon}
                resizeMode="cover"
              />
            )}
            <RN.Text style={styles.titleText}>{title.toUpperCase()}</RN.Text>
          </RN.View>
          {action}
        </RN.View>
      )}
      <RN.View style={groupStyles.main}>
        {padding ? (
          <RN.View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            {children}
          </RN.View>
        ) : (
          children
        )}
      </RN.View>
    </RN.View>
  );
}

function CategoryList({ refreshKey }: { refreshKey: number }) {
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const { token, isAuthorized } = useAuthorizationStore();

  React.useEffect(() => {
    fetchCategories();
  }, [refreshKey, token, isAuthorized]);

  async function fetchCategories() {
    if (!isAuthorized()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/user/data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(categoryName) {
    showConfirmationAlert({
      title: "Delete Category",
      content: `Are you sure you want to delete "${categoryName}" and all its GIFs?`,
      confirmText: "Delete",
      confirmColor: "red" as ButtonColors,
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${BASE_URL}/user/category/${encodeURIComponent(categoryName)}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            showToast(
              "Category deleted",
              getAssetIDByName("TrashIcon"),
            );
            await fetchCategories();
          } else {
            showToast("Failed to delete category", getAssetIDByName("Small"));
          }
        } catch (error) {
          console.error("Error deleting category:", error);
          showToast("Error deleting category", getAssetIDByName("Small"));
        }
      },
      cancelText: "Cancel",
    });
  }

  if (!isAuthorized()) {
    return (
      <Text style={styles.emptyText}>
        Please authorize to manage categories
      </Text>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <Text style={styles.emptyText}>
        No categories yet.
      </Text>
    );
  }

  return (
    <>
      {categories.map((category, index) => (
        <React.Fragment key={category.name}>
          <FormRow
            label={category.name}
            subLabel={`${category.gifs?.length || 0} GIFs`}
            trailing={
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteCategory(category.name)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            }
          />
          {index < categories.length - 1 && <FormDivider />}
        </React.Fragment>
      ))}
    </>
  );
}

export default function Settings() {
  useProxy(storage);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const { isAuthorized, token } = useAuthorizationStore();

  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState("");

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      showToast("Missing Name", getAssetIDByName("Small"))
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const response = await fetch(`${BASE_URL}/user/category`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        showToast("Category created", getAssetIDByName("Check"));
        setNewCategoryName("");
        setRefreshKey(prev => prev + 1);
      } else {
        const error = await response.json();
        setCreateError(error.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      setCreateError("Error creating category");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}
    >
      {!isAuthorized() && (
        <BetterTableRowGroup>
          <View>
            <Text style={styles.authText}>
              You need to authorize to create categories
            </Text>
          </View>

          <FormRow
            label="Authorize"
            leading={<FormRow.Icon source={getAssetIDByName("UserIcon")} />}
            trailing={FormArrow}
            onPress={showAuthorizationModal}
          />
        </BetterTableRowGroup>
      )}

      {isAuthorized() && (
        <BetterTableRowGroup title="Categories">
          <CategoryList refreshKey={refreshKey} />
        </BetterTableRowGroup>
      )}

      {isAuthorized() && (
        <BetterTableRowGroup title="Create Categories">
          <FormInput
            placeholder="Enter category name"
            value={newCategoryName}
            onChange={(v: string) => {
              setNewCategoryName(v);
              if (createError) setCreateError("");
            }}
            returnKeyType="done"
            onSubmitEditing={handleCreateCategory}
            style={{
              marginTop: 0,
              marginBottom: 8,
            }}
          />

          {createError ? (
            <Text style={{
              color: semanticColors.TEXT_DANGER,
              fontSize: 14,
            }}>
              {createError}
            </Text>
          ) : null}

          <FormRow
            label="Create Category"
            trailing={FormArrow}
            onPress={handleCreateCategory}
          />
        </BetterTableRowGroup>
      )}

      <BetterTableRowGroup
        title="More Options"
      >
        {isAuthorized() && (
          <FormRow
              color="danger"
              label="Logout"
              leading={
                <FormRow.Icon
                  source={getAssetIDByName("DoorExitIcon")}
                />
              }
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
        {isAuthorized() && (
          <FormDivider />
        )}
        <FormRow
          label="Source"
          leading={
            <FormRow.Icon
              source={getAssetIDByName("img_account_sync_github_white")}
            />
          }
          trailing={<FormRow.Icon source={getAssetIDByName("ic_launch")} />}
          onPress={() => RN.Linking.openURL("https://github.com/bwlok/revenge-plugins/tree/master/plugins/GifCategories")}
        />
      </BetterTableRowGroup>

      <RN.View style={{ height: 16 }} />

      <RN.Text style={styles.versionText}>Version 0.1.1</RN.Text>

      <RN.View style={{ height: 32 }} />
    </ScrollView>
  );
}
