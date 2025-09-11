import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import {
  tailwindConfig,
  brandName,
  unsubscribeUrl,
  brandIconUrl,
  welcomeEmailPreview,
} from "./config/config"

function Welcome({ unsubscribeToken }) {
  return (
    <Tailwind config={tailwindConfig}>
      <Html>
        <Head />
        <Body className="bg-background font-montserrat">
          {welcomeEmailPreview && <Preview>{welcomeEmailPreview}</Preview>}
          <Container className="bg-white text-foreground mx-auto pt-6">
            <Section className="px-6">
              <Section
                className={`text-center bg-primary-background bg-[url('${process.env.EMAIL_BRAND_COVER_IMAGE_URL}')] bg-cover bg-no-repeat bg-center`}
              >
                <Img
                  className="block pt-[8px] m-auto"
                  src={brandIconUrl}
                  width="40"
                  height="40"
                  alt={brandName}
                />
                <Hr className="w-[35%]" />
                <Text className="text-background text-md font-medium tracking-wider m-0">
                  BIENVENUE
                </Text>
              </Section>
              <Hr className="border-t border-muted-foreground my-5" />
              <Text className="text-base leading-6 text-left">
                Merci pour votre abonnement!
              </Text>
              <Text className="text-base leading-6 text-left">
                Bienvenue dans notre communauté, nous sommes ravis de vous
                compter parmi les premiers à nous suivre.
              </Text>
              <Text className="text-base leading-6 text-left">
                Utilisez le code promotionnel{" "}
                <Link className="text-accent-foreground font-bold">
                  LOGIK15
                </Link>{" "}
                lors de votre premier l'achat et{" "}
                <Link className="text-accent-foreground font-bold">
                  obtenez 15% de rabais
                </Link>{" "}
                suite au lancement officiel de notre site!
              </Text>
              <Button
                className="text-primary-foreground bg-primary-background text-base font-bold text-center block py-2.5 px-3 rounded-md"
                href="https://burologik.ca"
              >
                {brandName}
              </Button>
              <Hr className="border-t border-muted-foreground my-5" />
              <Text className="text-base leading-6 text-left">
                Cette offre exclusive sera réservée uniquement aux premières
                commandes.
              </Text>
              <Text className="text-base leading-6 text-left">
                Lorsque nous serons prêt, un courriel vous sera envoyé et vous
                pourrez profiter pleinement de cette offre exceptionnelle!
              </Text>
              <Text className="text-base leading-6 text-left">
                Restez à l'affût!
              </Text>
              <Text className="text-base leading-6 text-left">
                — L'équipe {brandName}
              </Text>
            </Section>
          </Container>
          <Container className="text-muted-foreground mx-auto pb-6">
            <Section className="px-6">
              <Text className="text-xs text-center">
                Vous recevez ce courriel car vous êtes abonné à notre
                infolettre. Si vous ne souhaitez plus recevoir ces courriels,
                vous pouvez vous{" "}
                <Link
                  className="text-primary-foreground underline"
                  href={`${unsubscribeUrl}?token=${unsubscribeToken}`}
                >
                  Désabonner
                </Link>
                .
              </Text>
              <Text className="text-xs text-center">
                © Burologik, {new Date().getFullYear()}. Tous droits réservés.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}

export default Welcome
