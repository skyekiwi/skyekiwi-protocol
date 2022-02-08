// Copyright 2021-2022 @skyekiwi/s-contract authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
export default {
  metadataVersion: '0.1.0',
  source: {
    hash: '0x1340c498ababdd0329a8736e0d7fcfd2d46f0a3162a3fec949ab9a85238db39d',
    language: 'ink! 3.0.0-rc4',
    compiler: 'rustc 1.53.0-nightly'
  },
  contract: {
    name: 'skyekiwi',
    version: '3.0.0-rc4',
    authors: [
      'SkyeKiwi Team <hello@skye.kiwi>'
    ]
  },
  spec: {
    constructors: [
      {
        args: [],
        docs: [],
        name: [
          'new'
        ],
        selector: '0x9bae9d5e'
      }
    ],
    docs: [],
    events: [
      {
        args: [
          {
            docs: [],
            indexed: true,
            name: 'id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            docs: [],
            indexed: true,
            name: 'owner',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [
          ' Event emitted when a vault is created'
        ],
        name: 'VaultCreation'
      },
      {
        args: [
          {
            docs: [],
            indexed: true,
            name: 'id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            docs: [],
            indexed: true,
            name: 'operator',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [
          ' Event emitted when a vault is updated'
        ],
        name: 'VaultUpdate'
      },
      {
        args: [
          {
            docs: [],
            indexed: true,
            name: 'id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            docs: [],
            indexed: true,
            name: 'owner',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          },
          {
            docs: [],
            indexed: true,
            name: 'member',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [
          ' Event emitted when an owner add member to a vault.'
        ],
        name: 'MemembershipGranted'
      },
      {
        args: [
          {
            docs: [],
            indexed: true,
            name: 'id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            docs: [],
            indexed: true,
            name: 'owner',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          },
          {
            docs: [],
            indexed: true,
            name: 'member',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [],
        name: 'MembershipRevoked'
      },
      {
        args: [
          {
            docs: [],
            indexed: true,
            name: 'id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            docs: [],
            indexed: true,
            name: 'owner',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [],
        name: 'VaultBurnt'
      }
    ],
    messages: [
      {
        args: [
          {
            name: 'id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          }
        ],
        docs: [],
        mutates: false,
        name: [
          'owner_of'
        ],
        payable: false,
        returnType: {
          displayName: [
            'Option'
          ],
          type: 16
        },
        selector: '0x99720c1e'
      },
      {
        args: [
          {
            name: 'metadata',
            type: {
              displayName: [
                'String'
              ],
              type: 15
            }
          }
        ],
        docs: [],
        mutates: true,
        name: [
          'create_vault'
        ],
        payable: false,
        returnType: {
          displayName: [
            'Result'
          ],
          type: 17
        },
        selector: '0x17ff6720'
      },
      {
        args: [
          {
            name: 'vault_id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            name: 'member',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [],
        mutates: true,
        name: [
          'nominate_member'
        ],
        payable: false,
        returnType: {
          displayName: [
            'Result'
          ],
          type: 19
        },
        selector: '0x9652ebb7'
      },
      {
        args: [
          {
            name: 'vault_id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            name: 'member',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [],
        mutates: true,
        name: [
          'remove_member'
        ],
        payable: false,
        returnType: {
          displayName: [
            'Result'
          ],
          type: 19
        },
        selector: '0xbfad17de'
      },
      {
        args: [
          {
            name: 'vault_id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            name: 'metadata',
            type: {
              displayName: [
                'String'
              ],
              type: 15
            }
          }
        ],
        docs: [],
        mutates: true,
        name: [
          'update_metadata'
        ],
        payable: false,
        returnType: {
          displayName: [
            'Result'
          ],
          type: 19
        },
        selector: '0x946de4ae'
      },
      {
        args: [
          {
            name: 'vault_id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          }
        ],
        docs: [],
        mutates: true,
        name: [
          'burn_vault'
        ],
        payable: false,
        returnType: {
          displayName: [
            'Result'
          ],
          type: 19
        },
        selector: '0x0aa2fd8b'
      },
      {
        args: [
          {
            name: 'vault_id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          }
        ],
        docs: [],
        mutates: false,
        name: [
          'get_metadata'
        ],
        payable: false,
        returnType: {
          displayName: [
            'Option'
          ],
          type: 20
        },
        selector: '0x928198d3'
      },
      {
        args: [
          {
            name: 'vault_id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            name: 'id',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [],
        mutates: false,
        name: [
          'authorize_owner'
        ],
        payable: false,
        returnType: {
          displayName: [
            'bool'
          ],
          type: 21
        },
        selector: '0xd3306038'
      },
      {
        args: [
          {
            name: 'vault_id',
            type: {
              displayName: [
                'VaultId'
              ],
              type: 4
            }
          },
          {
            name: 'id',
            type: {
              displayName: [
                'AccountId'
              ],
              type: 7
            }
          }
        ],
        docs: [],
        mutates: false,
        name: [
          'authorize_member'
        ],
        payable: false,
        returnType: {
          displayName: [
            'bool'
          ],
          type: 21
        },
        selector: '0x63754966'
      }
    ]
  },
  storage: {
    struct: {
      fields: [
        {
          layout: {
            struct: {
              fields: [
                {
                  layout: {
                    struct: {
                      fields: [
                        {
                          layout: {
                            cell: {
                              key: '0x0000000000000000000000000000000000000000000000000000000000000000',
                              ty: 1
                            }
                          },
                          name: 'header'
                        },
                        {
                          layout: {
                            struct: {
                              fields: [
                                {
                                  layout: {
                                    cell: {
                                      key: '0x0100000000000000000000000000000000000000000000000000000000000000',
                                      ty: 2
                                    }
                                  },
                                  name: 'len'
                                },
                                {
                                  layout: {
                                    array: {
                                      cellsPerElem: 1,
                                      layout: {
                                        cell: {
                                          key: '0x0100000001000000000000000000000000000000000000000000000000000000',
                                          ty: 3
                                        }
                                      },
                                      len: 4294967295,
                                      offset: '0x0200000000000000000000000000000000000000000000000000000000000000'
                                    }
                                  },
                                  name: 'elems'
                                }
                              ]
                            }
                          },
                          name: 'entries'
                        }
                      ]
                    }
                  },
                  name: 'keys'
                },
                {
                  layout: {
                    hash: {
                      layout: {
                        cell: {
                          key: '0x0200000001000000000000000000000000000000000000000000000000000000',
                          ty: 6
                        }
                      },
                      offset: '0x0100000001000000000000000000000000000000000000000000000000000000',
                      strategy: {
                        hasher: 'Blake2x256',
                        postfix: '',
                        prefix: '0x696e6b20686173686d6170'
                      }
                    }
                  },
                  name: 'values'
                }
              ]
            }
          },
          name: 'vault_owner'
        },
        {
          layout: {
            struct: {
              fields: [
                {
                  layout: {
                    struct: {
                      fields: [
                        {
                          layout: {
                            cell: {
                              key: '0x0200000001000000000000000000000000000000000000000000000000000000',
                              ty: 1
                            }
                          },
                          name: 'header'
                        },
                        {
                          layout: {
                            struct: {
                              fields: [
                                {
                                  layout: {
                                    cell: {
                                      key: '0x0300000001000000000000000000000000000000000000000000000000000000',
                                      ty: 2
                                    }
                                  },
                                  name: 'len'
                                },
                                {
                                  layout: {
                                    array: {
                                      cellsPerElem: 1,
                                      layout: {
                                        cell: {
                                          key: '0x0300000002000000000000000000000000000000000000000000000000000000',
                                          ty: 10
                                        }
                                      },
                                      len: 4294967295,
                                      offset: '0x0400000001000000000000000000000000000000000000000000000000000000'
                                    }
                                  },
                                  name: 'elems'
                                }
                              ]
                            }
                          },
                          name: 'entries'
                        }
                      ]
                    }
                  },
                  name: 'keys'
                },
                {
                  layout: {
                    hash: {
                      layout: {
                        cell: {
                          key: '0x0400000002000000000000000000000000000000000000000000000000000000',
                          ty: 12
                        }
                      },
                      offset: '0x0300000002000000000000000000000000000000000000000000000000000000',
                      strategy: {
                        hasher: 'Blake2x256',
                        postfix: '',
                        prefix: '0x696e6b20686173686d6170'
                      }
                    }
                  },
                  name: 'values'
                }
              ]
            }
          },
          name: 'vault_operators'
        },
        {
          layout: {
            struct: {
              fields: [
                {
                  layout: {
                    struct: {
                      fields: [
                        {
                          layout: {
                            cell: {
                              key: '0x0400000002000000000000000000000000000000000000000000000000000000',
                              ty: 1
                            }
                          },
                          name: 'header'
                        },
                        {
                          layout: {
                            struct: {
                              fields: [
                                {
                                  layout: {
                                    cell: {
                                      key: '0x0500000002000000000000000000000000000000000000000000000000000000',
                                      ty: 2
                                    }
                                  },
                                  name: 'len'
                                },
                                {
                                  layout: {
                                    array: {
                                      cellsPerElem: 1,
                                      layout: {
                                        cell: {
                                          key: '0x0500000003000000000000000000000000000000000000000000000000000000',
                                          ty: 3
                                        }
                                      },
                                      len: 4294967295,
                                      offset: '0x0600000002000000000000000000000000000000000000000000000000000000'
                                    }
                                  },
                                  name: 'elems'
                                }
                              ]
                            }
                          },
                          name: 'entries'
                        }
                      ]
                    }
                  },
                  name: 'keys'
                },
                {
                  layout: {
                    hash: {
                      layout: {
                        cell: {
                          key: '0x0600000003000000000000000000000000000000000000000000000000000000',
                          ty: 14
                        }
                      },
                      offset: '0x0500000003000000000000000000000000000000000000000000000000000000',
                      strategy: {
                        hasher: 'Blake2x256',
                        postfix: '',
                        prefix: '0x696e6b20686173686d6170'
                      }
                    }
                  },
                  name: 'values'
                }
              ]
            }
          },
          name: 'vault_metadata'
        },
        {
          layout: {
            cell: {
              key: '0x0600000003000000000000000000000000000000000000000000000000000000',
              ty: 4
            }
          },
          name: 'next_vaultid'
        }
      ]
    }
  },
  types: [
    {
      def: {
        composite: {
          fields: [
            {
              name: 'last_vacant',
              type: 2,
              typeName: 'Index'
            },
            {
              name: 'len',
              type: 2,
              typeName: 'u32'
            },
            {
              name: 'len_entries',
              type: 2,
              typeName: 'u32'
            }
          ]
        }
      },
      path: [
        'ink_storage',
        'collections',
        'stash',
        'Header'
      ]
    },
    {
      def: {
        primitive: 'u32'
      }
    },
    {
      def: {
        variant: {
          variants: [
            {
              fields: [
                {
                  type: 5,
                  typeName: 'VacantEntry'
                }
              ],
              name: 'Vacant'
            },
            {
              fields: [
                {
                  type: 4,
                  typeName: 'T'
                }
              ],
              name: 'Occupied'
            }
          ]
        }
      },
      params: [
        4
      ],
      path: [
        'ink_storage',
        'collections',
        'stash',
        'Entry'
      ]
    },
    {
      def: {
        primitive: 'u128'
      }
    },
    {
      def: {
        composite: {
          fields: [
            {
              name: 'next',
              type: 2,
              typeName: 'Index'
            },
            {
              name: 'prev',
              type: 2,
              typeName: 'Index'
            }
          ]
        }
      },
      path: [
        'ink_storage',
        'collections',
        'stash',
        'VacantEntry'
      ]
    },
    {
      def: {
        composite: {
          fields: [
            {
              name: 'value',
              type: 7,
              typeName: 'V'
            },
            {
              name: 'key_index',
              type: 2,
              typeName: 'KeyIndex'
            }
          ]
        }
      },
      params: [
        7
      ],
      path: [
        'ink_storage',
        'collections',
        'hashmap',
        'ValueEntry'
      ]
    },
    {
      def: {
        composite: {
          fields: [
            {
              type: 8,
              typeName: '[u8; 32]'
            }
          ]
        }
      },
      path: [
        'ink_env',
        'types',
        'AccountId'
      ]
    },
    {
      def: {
        array: {
          len: 32,
          type: 9
        }
      }
    },
    {
      def: {
        primitive: 'u8'
      }
    },
    {
      def: {
        variant: {
          variants: [
            {
              fields: [
                {
                  type: 5,
                  typeName: 'VacantEntry'
                }
              ],
              name: 'Vacant'
            },
            {
              fields: [
                {
                  type: 11,
                  typeName: 'T'
                }
              ],
              name: 'Occupied'
            }
          ]
        }
      },
      params: [
        11
      ],
      path: [
        'ink_storage',
        'collections',
        'stash',
        'Entry'
      ]
    },
    {
      def: {
        tuple: [
          4,
          7
        ]
      }
    },
    {
      def: {
        composite: {
          fields: [
            {
              name: 'value',
              type: 13,
              typeName: 'V'
            },
            {
              name: 'key_index',
              type: 2,
              typeName: 'KeyIndex'
            }
          ]
        }
      },
      params: [
        13
      ],
      path: [
        'ink_storage',
        'collections',
        'hashmap',
        'ValueEntry'
      ]
    },
    {
      def: {
        tuple: []
      }
    },
    {
      def: {
        composite: {
          fields: [
            {
              name: 'value',
              type: 15,
              typeName: 'V'
            },
            {
              name: 'key_index',
              type: 2,
              typeName: 'KeyIndex'
            }
          ]
        }
      },
      params: [
        15
      ],
      path: [
        'ink_storage',
        'collections',
        'hashmap',
        'ValueEntry'
      ]
    },
    {
      def: {
        primitive: 'str'
      }
    },
    {
      def: {
        variant: {
          variants: [
            {
              name: 'None'
            },
            {
              fields: [
                {
                  type: 7,
                  typeName: 'T'
                }
              ],
              name: 'Some'
            }
          ]
        }
      },
      params: [
        7
      ],
      path: [
        'Option'
      ]
    },
    {
      def: {
        variant: {
          variants: [
            {
              fields: [
                {
                  type: 4,
                  typeName: 'T'
                }
              ],
              name: 'Ok'
            },
            {
              fields: [
                {
                  type: 18,
                  typeName: 'E'
                }
              ],
              name: 'Err'
            }
          ]
        }
      },
      params: [
        4,
        18
      ],
      path: [
        'Result'
      ]
    },
    {
      def: {
        variant: {
          variants: [
            {
              discriminant: 0,
              name: 'VaultIdError'
            },
            {
              discriminant: 1,
              name: 'AccessDenied'
            },
            {
              discriminant: 2,
              name: 'MetadataNotValid'
            },
            {
              discriminant: 3,
              name: 'MathError'
            }
          ]
        }
      },
      path: [
        'skyekiwi',
        'skye_kiwi',
        'Error'
      ]
    },
    {
      def: {
        variant: {
          variants: [
            {
              fields: [
                {
                  type: 13,
                  typeName: 'T'
                }
              ],
              name: 'Ok'
            },
            {
              fields: [
                {
                  type: 18,
                  typeName: 'E'
                }
              ],
              name: 'Err'
            }
          ]
        }
      },
      params: [
        13,
        18
      ],
      path: [
        'Result'
      ]
    },
    {
      def: {
        variant: {
          variants: [
            {
              name: 'None'
            },
            {
              fields: [
                {
                  type: 15,
                  typeName: 'T'
                }
              ],
              name: 'Some'
            }
          ]
        }
      },
      params: [
        15
      ],
      path: [
        'Option'
      ]
    },
    {
      def: {
        primitive: 'bool'
      }
    }
  ]
};
