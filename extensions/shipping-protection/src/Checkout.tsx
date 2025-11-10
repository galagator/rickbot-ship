import {
  reactExtension,
  useApplyCartLinesChange,
  useCartLines,
  useSettings,
  View,
  BlockStack,
  InlineStack,
  Text,
  Checkbox,
  Link
} from "@shopify/ui-extensions-react/checkout";

type Settings = { protectionVariantGID?: string; defaultOn?: boolean };

export default reactExtension("purchase.checkout.block.render", () => <Extension />);

function Extension() {
  const { protectionVariantGID, defaultOn } = useSettings<Settings>();
  const applyCartLinesChange = useApplyCartLinesChange();
  const lines = useCartLines();

  if (!protectionVariantGID) return <Text appearance="subdued">Shipping protection not configured</Text>;

  const existing = getExistingProtectionLine(lines, protectionVariantGID);

  const g = globalThis as any;
  if (defaultOn && !existing && !g.__pp_bootstrapped) {
    g.__pp_bootstrapped = true;
    void applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: protectionVariantGID,
      quantity: 1,
    });
  }

  const checked = !!existing;
  const priceText = existing ? formatLinePrice(existing) : undefined;

  return (
    <View border="base" cornerRadius="large" padding="base">
      <BlockStack spacing="tight">
        <InlineStack>
          <Checkbox
            checked={checked}
            onChange={(val: boolean) => {
              if (val && !existing) {
                void applyCartLinesChange({
                  type: "addCartLine",
                  merchandiseId: protectionVariantGID,
                  quantity: 1,
                });
              } else if (!val && existing) {
                void applyCartLinesChange({
                  type: "updateCartLine",
                  id: existing.id,
                  quantity: 0,
                });
              }
            }}
            accessibilityLabel="Add shipping protection"
          />
          <Text size="medium" emphasis="bold">Shipping Protection</Text>
          <Link to="https://www.hideaway.online/pages/delivery-protection-terms" external appearance="monochrome">
            <View>
              <Text appearance="subdued">ⓘ</Text>
            </View>
          </Link>
        </InlineStack>

        <InlineStack>

          <Text>
            Get full refund protection against shipping delays, loss, damage, and theft
            {priceText ? <> for just <Text emphasis="bold">{priceText}</Text></> : null}.
          </Text>
        </InlineStack>
      </BlockStack>
    </View>
  );
}

/** Helpers */
function getExistingProtectionLine(lines: any[], merchandiseId: string) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && line.merchandise && line.merchandise.id === merchandiseId) return line;
  }
  return undefined;
}

function formatLinePrice(line: any) {
  const money =
    (line.cost && line.cost.amountPerQuantity) ||
    (line.cost && line.cost.totalAmount);
  if (!money || !money.amount || !money.currencyCode) return "";
  const amount = Number(money.amount);
  const code = String(money.currencyCode);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(isFinite(amount) ? amount : 0);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}
