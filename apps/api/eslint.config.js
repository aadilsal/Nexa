/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    files: ["src/modules/admin/**/*.ts", "src/modules/analytics/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "../../common/encryption/user-encryption.service",
              message:
                "Admin/analytics modules must not access user encryption.",
            },
            {
              name: "../transactions/ledger.service",
              message:
                "Admin/analytics modules must not access the transaction ledger.",
            },
            {
              name: "../engine/engine-data.service",
              message:
                "Admin/analytics modules must not access engine data directly.",
            },
          ],
          patterns: [
            {
              group: ["**/user-encryption.service", "**/ledger.service"],
              message: "Privacy boundary: finance decryption not allowed here.",
            },
          ],
        },
      ],
    },
  },
];
