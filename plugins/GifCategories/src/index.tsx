import { findByProps, findByName, findByTypeName} from "@vendetta/metro";
import { instead, after, before } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { React } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";


import settings from "./Settings.js";
import { useAuthorizationStore } from "./utils/AuthorizationStore";
import { BASE_URL } from "./utils/constants";

const GIFPickerStore = findByProps("getTrendingCategories");
const GIFPickerCategoriesPage = findByTypeName("GIFPickerCategoriesPage");

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;
const Navigator = findByName("Navigator") ?? findByProps("Navigator")?.Navigator;
const Navigation = findByProps("push", "pushLazy", "pop");
const modalCloseButton = findByProps("getRenderCloseButton")?.getRenderCloseButton ?? findByProps("getHeaderCloseButton")?.getHeaderCloseButton;
import SaveCGifPage from "./SaveCGifPage";


let currentCustomCategory = null;
let customCategories = [];

let patches = [];

function extractGIFFromMessage(message) {
  const embed = message.embeds?.[0];
  if (!embed) return null;

  const isGifv = embed.type === 'gifv';
  const isAnimatedImage = embed.type === 'image' && embed.image?.srcIsAnimated;

  const isStaticGifImage = embed.type === 'image' &&
                          embed.image?.contentType === 'image/gif';

  const hasGifUrl = embed.url?.includes('.gif') ||
                   embed.image?.url?.includes('.gif');

  if (!isGifv && !isAnimatedImage && !isStaticGifImage && !hasGifUrl) return null;

  const embedUrl = embed.url;
  let width, height, src, format;

  if ((isAnimatedImage || isStaticGifImage || hasGifUrl) && embed.image) {
    width = embed.image.width || 498;
    height = embed.image.height || 498;
    src = embed.image.url || embedUrl;
    format = 1;

    return {
      format: format,
      src: src,
      url: embedUrl,
      width: width,
      height: height,
      provider: 'discord'
    };
  }

  if (isGifv) {
    const provider = embed.provider?.name?.toLowerCase();
    width = embed.video?.width || embed.thumbnail?.width || 498;
    height = embed.video?.height || embed.thumbnail?.height || 498;
    switch(provider) {
      case 'tenor':
        src = embedUrl + '.gif';
        format = 2;
        break;
      case 'giphy':
        const giphyMatch = embedUrl.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)$/);
        if (giphyMatch) {
          const giphyId = giphyMatch[1];
          src = `https://media.giphy.com/media/${giphyId}/giphy.gif`;
        } else {
          src = embedUrl;
        }
        format = 2;
        break;
      case 'imgur':
        if (embed.video?.url) {
          src = embed.video.url.replace(/\.(mp4|gifv)$/, '.gif');
        } else {
          src = embedUrl.replace(/\.(mp4|gifv)$/, '.gif');
        }
        format = 2;
        break;
      default:
        src = embed.video?.url || embed.thumbnail?.url || embedUrl;
        format = 2;
        break;
    }
    return {
      format: format,
      src: src,
      url: embedUrl,
      width: width,
      height: height,
      provider: provider || 'unknown'
    };
  }

  return null;
}

async function fetchCustomCategories() {
  const { token, isAuthorized } = useAuthorizationStore.getState();
  if (!isAuthorized()) {
    customCategories = [];
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
      customCategories = data;
    } else {
      console.error("[SaveGif] Failed to fetch categories:", response.status);
      customCategories = [];
    }
  } catch (error) {
    console.error("[SaveGif] Error fetching categories:", error);
    customCategories = [];
  }
}

export default {
  onLoad: () => {
    //Initial load
    fetchCustomCategories();

    patches.push(
      //Hook into trending categories to insert our own categories
      after("getTrendingCategories", GIFPickerStore, (args, ret) => {
        fetchCustomCategories();


        const { isAuthorized } = useAuthorizationStore.getState();

        if (!isAuthorized() || customCategories.length === 0) {
          return ret;
        }

        customCategories.forEach((category) => {
          const isPresent = ret.some(item =>
            item.type === category.type &&
            item.name === category.name &&
            //item.src === category.src &&
            item.format === category.format
          );

          if (ret[0] && !isPresent) {
            ret.splice(1, 0, {
              type: category.type,
              name: category.name,
              src: category.src,
              format: category.format
            });
          }
        });
      })
    );

    patches.push(
      //Hook into category page to show custom stuff when clicking on our categories
      after("type", GIFPickerCategoriesPage, (args, ret) => {
        const CategoriesProps = findInReactTree(ret, (x) => x?.props);

        after("renderItem", CategoriesProps.props, (args, ret) => {
          if (ret && ret.props && ret.props.children) {
            if (Array.isArray(ret.props.children)) {
              ret.props.children.forEach((child) => {
                if (child.props.onSelectCategory) {
                  instead("onSelectCategory", child.props, (args, orig) => {
                    const [categoryType, categoryName] = args;

                    if (categoryType === "BetterCategory") {
                      const selectedCategory = customCategories.find(
                        c => c.name === categoryName
                      );

                      if (selectedCategory) {
                        currentCustomCategory = selectedCategory;

                        return orig("Favorites", categoryName);
                      }
                    }

                    currentCustomCategory = null;
                    return orig(...args);
                  });
                }
              });
            }
          }
        });
      })
    );

    patches.push(
      //Hook into function that returns GIFs to show our own in custom categories
      instead("useSortedFavoriteGIFs", findByProps("useFavoriteGIFs"), (args, orig) => {

        const result = orig(...args);

        if (currentCustomCategory) {
          const customGifs = currentCustomCategory.gifs;

          currentCustomCategory = null;

          return customGifs;
        }

        return result;
      })
    );



    patches.push(
      //Hook into ActionSheet to insert SaveGif button
      before("openLazy", LazyActionSheet, ([component, key, msg]) => {
        const message = msg?.message;
        if (key !== "MessageLongPressActionSheet" || !message) return;

        const gifData = extractGIFFromMessage(message);

        if (!gifData) return;

        component.then((instance) => {
          const unpatch = after("default", instance, (_, component) => {
            React.useEffect(
              () => () => {
                unpatch();
              },
              [],
            );

            const navigator = () => (
              <Navigator
                initialRouteName="SaveGif"
                goBackOnBackPress
                screens={{
                  SaveGif: {
                    title: "Select a Category",
                    headerLeft: modalCloseButton?.(() => Navigation.pop()),
                    render: () => <SaveCGifPage gifData={gifData} />,
                  },
                }}
              />
            );

            const actionSheetContainer = findInReactTree(
              component,
              (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
            );
            const buttons = findInReactTree(
              component,
              (x) => x?.[0]?.type?.name === "ButtonRow",
            );

            if (buttons) {
              buttons.push(
                <FormRow
                  label="Save GIF to Category"
                  leading={
                    <FormIcon
                      style={{ opacity: 1 }}
                      source={getAssetIDByName("gif")}
                    />
                  }
                  onPress={() => {
                    LazyActionSheet.hideActionSheet();
                    Navigation.push(navigator);
                  }}
                />,
              );
            } else if (actionSheetContainer && actionSheetContainer[1]) {
              const upperGroup = actionSheetContainer[0];
              const ActionSheetRow = upperGroup.props.children[0].type;

              const saveGifButton = (
                <ActionSheetRow
                  label="Save GIF to Category"
                  icon={{
                    $$typeof: upperGroup.props.children[0].props.icon.$$typeof,
                    type: upperGroup.props.children[0].props.icon.type,
                    key: null,
                    ref: null,
                    props: {
                      IconComponent: () => (
                        <FormIcon
                          style={{ opacity: 1 }}
                          source={getAssetIDByName("gif")}
                        />
                      ),
                    },
                  }}
                  onPress={() => {
                    LazyActionSheet.hideActionSheet();
                    Navigation.push(navigator);
                  }}
                  key="save-gif"
                />
              );

              upperGroup.props.children.push(saveGifButton);
            } else {
              console.log("[SaveGif] Error: Could not find ActionSheet");
            }
          });
        });
      })
    );



  },
  onUnload: () => {
	  for (const x of patches) x();
  },
  settings,
}


// Dont think i can actually change the Favorites title when selected a category but not high prio anyway
// TODO: Much later, add option for e2e encryption -> user sets password or like that, plugin locally encrypts the gifs object and only then sends it to server ->
// server then later sending back and plugin decrypting. Ofc if password ever lost he fucked so give kind of warning before enabling
