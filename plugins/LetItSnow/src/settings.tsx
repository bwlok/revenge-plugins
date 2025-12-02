import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { React, ReactNative as RN, stylesheet } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";


const { ScrollView, View, Text, Image } = RN;
const { FormRow, FormSwitchRow } = Forms;

storage.SnowPerformance ??= false;


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
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  image: {
    width: 70,
    height: 70,
    marginTop: 20,
    marginLeft: 20
  },
  title: {
    flexDirection: "column",
  },
  name: {
    fontSize: 30,
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 30,
    color: semanticColors.HEADER_PRIMARY,
  },
  author: {
    fontSize: 15,
    paddingLeft: 50,
    color: semanticColors.HEADER_SECONDARY,
  },
  info: {
    height: 45,
    paddingTop: 3,
    paddingBottom: 3,
    justifyContent: "center",
    alignItems: "center"
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



export default function Settings() {
  useProxy(storage);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}
    >

      <View style={styles.container}>
        <Image
          source={{uri: 'https://cdn.bwlok.dev/snowflake.png'}}
          style={styles.image}
        />
        <View style={styles.title}>
          <Text style={styles.name}>Let it Snow</Text>
          <Text style={styles.author}>by Bwlok</Text>
        </View>
      </View>

      <BetterTableRowGroup >
        <FormSwitchRow
          label="Enable Performance mode"
          subLabel="Reduce animations and rendering to a minimum. Requires a restart"
          value={storage.SnowPerformance}
          onValueChange={(v) => {
            storage.SnowPerformance = v;
          }}
        />
      </BetterTableRowGroup>

      <BetterTableRowGroup
        title="More Options"
      >
        <FormRow
          label="Source"
          leading={
            <FormRow.Icon
              source={getAssetIDByName("img_account_sync_github_white")}
            />
          }
          trailing={<FormRow.Icon source={getAssetIDByName("ic_launch")} />}
          onPress={() => RN.Linking.openURL("https://github.com/bwlok/revenge-plugins/tree/master/plugins/LetItSnow")}
        />
      </BetterTableRowGroup>

      <RN.View style={{ height: 16 }} />

      <RN.Text style={styles.versionText}>Version 0.0.1</RN.Text>

      <RN.View style={{ height: 32 }} />
    </ScrollView>
  );
}
